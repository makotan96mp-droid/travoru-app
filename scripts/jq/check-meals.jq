def meals: map(select(.title|test("ランチ|夕食")));
def times_ok: (map(.time) | (length == (unique|length)));
[.day1,.day2,.day3,.day4,.day5] | all(. == null or (. as $d | ($d|meals|times_ok)))
