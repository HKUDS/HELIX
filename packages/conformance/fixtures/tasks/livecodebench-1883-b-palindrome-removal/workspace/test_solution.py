import io
import subprocess
import sys
from collections import Counter
from pathlib import Path

from solution import can_make_palindrome_after_removals


ROOT = Path(__file__).resolve().parent


def expected(n: int, k: int, s: str) -> str:
    odd = sum(count % 2 for count in Counter(s).values())
    return "YES" if odd <= k + 1 else "NO"


def run_cli(stdin: str) -> str:
    completed = subprocess.run(
        [sys.executable, str(ROOT / "solution.py")],
        input=stdin,
        universal_newlines=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=True,
    )
    return completed.stdout.strip()


def main() -> None:
    cases = [
        (1, 0, "a"),
        (2, 0, "ab"),
        (2, 1, "ba"),
        (3, 1, "abb"),
        (3, 2, "abc"),
        (6, 2, "bacacd"),
        (6, 2, "fagbza"),
        (6, 2, "zwaafa"),
        (7, 2, "taagaak"),
        (14, 3, "ttrraakkttoorr"),
        (5, 3, "debdb"),
        (5, 4, "ecadc"),
        (5, 3, "debca"),
        (5, 3, "abaac"),
        (8, 0, "aabbccdd"),
        (8, 1, "abcddcba"),
        (9, 2, "aaabbbbcc"),
        (10, 4, "abcdefghij"),
        (11, 5, "zzxyyxabcde"),
    ]
    for n, k, s in cases:
        actual = can_make_palindrome_after_removals(n, k, s)
        assert actual == expected(n, k, s), (n, k, s, actual, expected(n, k, s))

    stdin = io.StringIO()
    stdin.write(f"{len(cases)}\n")
    for n, k, s in cases:
        stdin.write(f"{n} {k}\n{s}\n")
    expected_stdout = "\n".join(expected(n, k, s) for n, k, s in cases)
    assert run_cli(stdin.getvalue()) == expected_stdout
    print("livecodebench-1883-b tests passed")


if __name__ == "__main__":
    main()
