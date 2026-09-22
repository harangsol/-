"""핵심 로직 회귀 테스트: python3 -m unittest discover -s tests"""

import sys
import tempfile
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from viralfinder.config import Config  # noqa: E402
from viralfinder.models import Post, parse_ts  # noqa: E402
from viralfinder.relevance import detect_hooks, evaluate  # noqa: E402
from viralfinder.scoring import engagement_rate, score_batch, view_multiple  # noqa: E402
from viralfinder.sources.sample import collect as collect_sample  # noqa: E402
from viralfinder.store import Store  # noqa: E402


def make_post(**kw) -> Post:
    base = dict(
        platform="instagram", post_id="x", caption="", likes=0, comments=0,
        posted_at=datetime.now(timezone.utc) - timedelta(days=1),
    )
    base.update(kw)
    return Post(**base)


class TestTimestamps(unittest.TestCase):
    def test_parses_common_formats(self):
        self.assertIsNotNone(parse_ts("2026-01-02T03:04:05Z"))
        self.assertIsNotNone(parse_ts(1735780000))
        self.assertIsNotNone(parse_ts("2026-01-02"))
        self.assertIsNone(parse_ts(""))
        self.assertIsNone(parse_ts("어제"))

    def test_naive_datetime_becomes_utc(self):
        parsed = parse_ts("2026-01-02 03:04:05")
        self.assertEqual(parsed.tzinfo, timezone.utc)


class TestRelevance(unittest.TestCase):
    def setUp(self):
        self.config = Config.load()

    def test_core_keyword_scores_high(self):
        post = make_post(caption="정책자금 한도와 금리 정리했습니다. 소상공인 사장님 보세요.")
        score, topics, _ = evaluate(post, self.config)
        self.assertGreaterEqual(score, 0.6)
        self.assertIn("정책자금", topics)

    def test_unrelated_post_scores_zero(self):
        post = make_post(caption="성수동 카페 웨이팅 없는 시간대 알려드립니다")
        score, topics, _ = evaluate(post, self.config)
        self.assertEqual(score, 0.0)
        self.assertEqual(topics, [])

    def test_negative_keyword_blocks_post(self):
        post = make_post(caption="절세 세액공제 정보는 리딩방에서 무료로 드립니다")
        score, _, _ = evaluate(post, self.config)
        self.assertEqual(score, 0.0)

    def test_multi_topic_gets_bonus(self):
        post = make_post(caption="정책자금 받고 종합소득세 절세까지 한 번에 잡는 법, 세액공제 포함")
        score, topics, _ = evaluate(post, self.config)
        self.assertGreaterEqual(len(topics), 2)
        self.assertGreater(score, 0.85)

    def test_hashtag_only_signal_is_weak(self):
        post = make_post(caption="오늘의 브이로그", hashtags=["재테크"])
        score, _, _ = evaluate(post, self.config)
        self.assertLess(score, 0.3)


class TestScoring(unittest.TestCase):
    def test_small_account_outranks_large_at_same_engagement(self):
        small = make_post(post_id="s", author="small", author_followers=2_000,
                          likes=3000, comments=200, views=200_000,
                          caption="정책자금")
        large = make_post(post_id="l", author="large", author_followers=500_000,
                          likes=3000, comments=200, views=200_000,
                          caption="정책자금")
        ranked = score_batch([large, small])
        self.assertEqual(ranked[0].post_id, "s")

    def test_recent_post_outranks_old_at_same_engagement(self):
        now = datetime.now(timezone.utc)
        fresh = make_post(post_id="f", author="a", likes=5000, views=100_000,
                          posted_at=now - timedelta(hours=12))
        stale = make_post(post_id="o", author="b", likes=5000, views=100_000,
                          posted_at=now - timedelta(days=60))
        ranked = score_batch([stale, fresh])
        self.assertEqual(ranked[0].post_id, "f")

    def test_score_within_bounds_and_tier_assigned(self):
        posts = collect_sample()
        ranked = score_batch(posts)
        for post in ranked:
            self.assertGreaterEqual(post.score, 0.0)
            self.assertLessEqual(post.score, 100.0)
            self.assertIn(post.tier, {"S", "A", "B", "C"})

    def test_missing_followers_does_not_crash(self):
        posts = [make_post(post_id=str(i), author_followers=None, likes=i * 10)
                 for i in range(5)]
        ranked = score_batch(posts)
        self.assertEqual(len(ranked), 5)
        self.assertNotIn("follower_outlier", ranked[0].score_parts)

    def test_rates_return_none_without_denominator(self):
        self.assertIsNone(engagement_rate(make_post(author_followers=None)))
        self.assertIsNone(view_multiple(make_post(views=None, author_followers=100)))

    def test_empty_batch(self):
        self.assertEqual(score_batch([]), [])


class TestEngagement(unittest.TestCase):
    def test_saves_and_comments_weigh_more_than_likes(self):
        likey = make_post(likes=1000)
        savey = make_post(likes=0, saves=1000)
        self.assertGreater(savey.engagement, likey.engagement)

    def test_hook_is_first_non_hashtag_line(self):
        post = make_post(caption="#정책자금\n진짜 첫 줄입니다\n두 번째 줄")
        self.assertEqual(post.hook, "진짜 첫 줄입니다")


class TestHookPatterns(unittest.TestCase):
    def test_detects_number_and_loss_aversion(self):
        config = Config.load()
        labels = detect_hooks("모르면 손해보는 500만원짜리 공제", config)
        self.assertIn("숫자제시", labels)
        self.assertIn("손실회피", labels)


class TestStore(unittest.TestCase):
    def test_upsert_updates_instead_of_duplicating(self):
        with tempfile.TemporaryDirectory() as tmp:
            store = Store(Path(tmp) / "t.db")
            post = make_post(post_id="dup", likes=10, caption="정책자금 안내")
            store.upsert([post])
            post.likes = 999
            new, updated = store.upsert([post])
            self.assertEqual((new, updated), (0, 1))
            rows = store.fetch(min_relevance=0.0)
            self.assertEqual(len(rows), 1)
            self.assertEqual(rows[0].likes, 999)
            store.close()

    def test_roundtrip_preserves_fields(self):
        with tempfile.TemporaryDirectory() as tmp:
            store = Store(Path(tmp) / "t.db")
            post = make_post(post_id="rt", caption="절세 팁", hashtags=["절세"],
                             topics=["절세"], views=1234, author_followers=555)
            store.upsert([post])
            loaded = store.fetch(min_relevance=0.0)[0]
            self.assertEqual(loaded.hashtags, ["절세"])
            self.assertEqual(loaded.views, 1234)
            self.assertEqual(loaded.author_followers, 555)
            store.close()

    def test_growth_needs_two_observations(self):
        with tempfile.TemporaryDirectory() as tmp:
            store = Store(Path(tmp) / "t.db")
            post = make_post(post_id="g", caption="저축")
            store.upsert([post])
            self.assertIsNone(store.growth(post.key))
            store.close()


class TestSampleSource(unittest.TestCase):
    def test_sample_loads_and_has_both_platforms(self):
        posts = collect_sample()
        self.assertGreater(len(posts), 20)
        self.assertEqual({p.platform for p in posts}, {"instagram", "threads"})


if __name__ == "__main__":
    unittest.main()
