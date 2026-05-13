#!/usr/bin/env python3
import argparse
import json
import sys
import time
import urllib.error
import urllib.parse
import urllib.request


def request(method: str, url: str, payload=None, token: str | None = None):
    data = None
    headers = {}

    if payload is not None:
        data = json.dumps(payload).encode("utf-8")
        headers["Content-Type"] = "application/json"

    if token:
        headers["Authorization"] = f"Bearer {token}"

    req = urllib.request.Request(url, data=data, headers=headers, method=method)

    try:
        with urllib.request.urlopen(req, timeout=20) as response:
            body = response.read().decode("utf-8")
            return response.status, json.loads(body) if body else None
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8")
        payload = json.loads(body) if body else None
        return exc.code, payload


def expect_status(step: str, status: int, expected: set[int], payload):
    if status not in expected:
        print(f"[FAIL] {step}: expected {sorted(expected)}, got {status}")
        if payload is not None:
            print(json.dumps(payload, indent=2))
        sys.exit(1)

    print(f"[OK] {step}: {status}")
    if payload is not None:
        print(json.dumps(payload, indent=2))


def main():
    parser = argparse.ArgumentParser(
        description="Run live QA for company signup + join-request approval flow."
    )
    parser.add_argument(
        "--base-url",
        default="http://127.0.0.1:8000",
        help="Backend origin. Default: http://127.0.0.1:8000",
    )
    parser.add_argument(
        "--password",
        default="Pass1234",
        help="Password to use for created QA accounts. Must satisfy backend validation.",
    )
    args = parser.parse_args()

    api_base = args.base_url.rstrip("/") + "/api"
    ts = str(int(time.time()))
    company_name = f"QA Tenant {ts}"
    admin_email = f"qa.admin.{ts}@example.com"
    member_email = f"qa.member.{ts}@example.com"

    print("Running join-request QA flow")
    print(f"Base URL: {args.base_url}")
    print(f"Company: {company_name}")
    print(f"Admin: {admin_email}")
    print(f"Member: {member_email}")

    status, payload = request("GET", f"{api_base}/health")
    expect_status("health", status, {200}, payload)

    status, payload = request(
        "POST",
        f"{api_base}/signup-company",
        {
            "company_name": company_name,
            "email": admin_email,
            "password": args.password,
        },
    )
    expect_status("signup_company", status, {201}, payload)

    status, payload = request(
        "POST",
        f"{api_base}/login",
        {
            "email": admin_email,
            "password": args.password,
        },
    )
    expect_status("admin_login", status, {200}, payload)
    admin_token = payload["data"]["access_token"]

    status, payload = request("GET", f"{api_base}/me", token=admin_token)
    expect_status("admin_me", status, {200}, payload)

    query = urllib.parse.quote(company_name)
    status, payload = request("GET", f"{api_base}/companies/discover?query={query}")
    expect_status("discover_company", status, {200}, payload)

    discovered_names = [row.get("name") for row in payload.get("data") or []]
    if company_name not in discovered_names:
        print("[FAIL] discover_company: created company not returned by discovery search")
        sys.exit(1)
    print("[OK] discover_company_contains_created_company")

    status, payload = request(
        "POST",
        f"{api_base}/join-requests",
        {
            "company_name": company_name,
            "email": member_email,
            "password": args.password,
            "requested_role": "editor",
        },
    )
    expect_status("join_request_create", status, {201}, payload)
    join_request_id = payload["data"]["id"]

    status, payload = request(
        "POST",
        f"{api_base}/login",
        {
            "email": member_email,
            "password": args.password,
        },
    )
    expect_status("member_login_before_approval", status, {403}, payload)

    status, payload = request("GET", f"{api_base}/join-requests", token=admin_token)
    expect_status("join_request_list", status, {200}, payload)

    listed_ids = [row.get("id") for row in payload.get("data") or []]
    if join_request_id not in listed_ids:
        print("[FAIL] join_request_list: new join request not returned for admin")
        sys.exit(1)
    print("[OK] join_request_list_contains_created_request")

    status, payload = request(
        "PATCH",
        f"{api_base}/join-requests/{join_request_id}/approve",
        {
            "role": "editor",
        },
        token=admin_token,
    )
    expect_status("join_request_approve", status, {200}, payload)

    status, payload = request(
        "POST",
        f"{api_base}/login",
        {
            "email": member_email,
            "password": args.password,
        },
    )
    expect_status("member_login_after_approval", status, {200}, payload)
    member_token = payload["data"]["access_token"]

    status, payload = request("GET", f"{api_base}/me", token=member_token)
    expect_status("member_me", status, {200}, payload)

    print("Flow passed.")


if __name__ == "__main__":
    main()
