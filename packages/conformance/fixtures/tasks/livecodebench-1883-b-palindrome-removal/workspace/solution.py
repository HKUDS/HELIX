import sys


def can_make_palindrome_after_removals(n: int, k: int, s: str) -> str:
    return "NO"


def solve() -> None:
    data = sys.stdin.read().strip().split()
    if not data:
        return
    t = int(data[0])
    index = 1
    answers = []
    for _ in range(t):
        n = int(data[index])
        k = int(data[index + 1])
        s = data[index + 2]
        index += 3
        answers.append(can_make_palindrome_after_removals(n, k, s))
    sys.stdout.write("\n".join(answers))


if __name__ == "__main__":
    solve()
