"""SMTP로 메일 보내기.

환경변수
- SMTP_HOST, SMTP_PORT(기본 587), SMTP_USER, SMTP_PASSWORD
- SMTP_SECURITY: starttls(기본) | ssl | none
- MAIL_FROM(기본 SMTP_USER), MAIL_FROM_NAME(기본 BIDALERT_BRAND), MAIL_REPLY_TO(선택)
Gmail은 SMTP_HOST=smtp.gmail.com, 앱 비밀번호 사용. 네이버는 smtp.naver.com:465 + ssl.
"""

from __future__ import annotations

import os
import smtplib
import ssl
from dataclasses import dataclass
from email.message import EmailMessage
from email.utils import formataddr, make_msgid

from .digest import Digest, brand


class MailConfigError(ValueError):
    pass


@dataclass
class SmtpSettings:
    host: str
    port: int
    user: str
    password: str
    security: str
    sender: str
    sender_name: str
    reply_to: str

    @classmethod
    def from_env(cls) -> "SmtpSettings":
        host = os.environ.get("SMTP_HOST", "")
        user = os.environ.get("SMTP_USER", "")
        password = os.environ.get("SMTP_PASSWORD", "")
        missing = [k for k, v in (("SMTP_HOST", host), ("SMTP_USER", user), ("SMTP_PASSWORD", password)) if not v]
        if missing:
            raise MailConfigError(f"메일 발송 설정이 없습니다: {', '.join(missing)}")
        security = (os.environ.get("SMTP_SECURITY") or "starttls").lower()
        if security not in ("starttls", "ssl", "none"):
            raise MailConfigError("SMTP_SECURITY는 starttls, ssl, none 중 하나여야 합니다.")
        default_port = 465 if security == "ssl" else 587
        return cls(
            host=host,
            port=int(os.environ.get("SMTP_PORT") or default_port),
            user=user,
            password=password,
            security=security,
            sender=os.environ.get("MAIL_FROM") or user,
            sender_name=os.environ.get("MAIL_FROM_NAME") or brand(),
            reply_to=os.environ.get("MAIL_REPLY_TO") or "",
        )


def build_message(digest: Digest, to: list[str], settings: SmtpSettings) -> EmailMessage:
    msg = EmailMessage()
    msg["Subject"] = digest.subject
    msg["From"] = formataddr((settings.sender_name, settings.sender))
    msg["To"] = ", ".join(to)
    if settings.reply_to:
        msg["Reply-To"] = settings.reply_to
    msg["Message-ID"] = make_msgid(domain=settings.sender.partition("@")[2] or None)
    msg.set_content(digest.text)
    msg.add_alternative(digest.html, subtype="html")
    for filename, data, mime in digest.attachments:
        maintype, _, subtype = mime.partition("/")
        msg.add_attachment(data, maintype=maintype, subtype=subtype, filename=filename)
    return msg


class Mailer:
    def __init__(self, settings: SmtpSettings):
        self.settings = settings
        self._smtp: smtplib.SMTP | None = None

    def __enter__(self) -> "Mailer":
        s = self.settings
        if s.security == "ssl":
            self._smtp = smtplib.SMTP_SSL(s.host, s.port, context=ssl.create_default_context(), timeout=30)
        else:
            self._smtp = smtplib.SMTP(s.host, s.port, timeout=30)
            if s.security == "starttls":
                self._smtp.starttls(context=ssl.create_default_context())
        self._smtp.login(s.user, s.password)
        return self

    def __exit__(self, *exc) -> None:
        if self._smtp:
            try:
                self._smtp.quit()
            except smtplib.SMTPException:
                pass

    def send(self, digest: Digest, to: list[str]) -> None:
        assert self._smtp, "Mailer는 with 블록 안에서 쓰세요."
        self._smtp.send_message(build_message(digest, to, self.settings))
