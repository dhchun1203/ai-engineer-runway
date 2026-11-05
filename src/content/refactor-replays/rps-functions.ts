// 8회차 가위바위보 코드를 함수로 다시 짜는 과정(레슨 11절의 재생기 데이터).
// original은 수업 시간에 직접 친 코드 그대로, steps는 한 단계씩 적용할 고침이다.
// 각 단계의 ops는 RefactorReplay가 순서대로 적용한다: mark는 강조만, after는 그 줄 뒤에
// 끼워 넣기, replace는 [시작 줄, 끝 줄]을 지우고 lines로 바꾸기. 끝 줄이 "a\nb"면
// 두 줄이 이어지는 곳을 끝으로 찾는다. 마지막 결과는 원래 코드와 출력이 같음을 확인했다
// (같은 입력과 같은 컴퓨터 손, 2026-11-05).
import type { RefactorReplayData } from "./types";

export const rpsFunctions: RefactorReplayData = {
  "original": [
    "import random",
    "# 가위 바위 보 게임 미니 프로젝트",
    "",
    "",
    "print(\"=\" * 30)",
    "print(\"가위바위보 게임\")",
    "print(\"=\" * 30)",
    "",
    "# 플레이어 이름 입력",
    "player_name = input(\"플레이어 이름을 입력하세요 : \")",
    "",
    "game_data = {\"1\":\"가위\", \"2\":\"바위\", \"3\":\"보\"}",
    "",
    "retry_value = \"\" # 재도전 여부",
    "win_cnt = 0 # 승리 카운터",
    "winning_streak_cnt = 0 # 연승 카운터",
    "lose_cnt = 0 # 패배 카운터",
    "game_record_list = [] # 경기 기록 리스트",
    "",
    "",
    "while retry_value == \"yes\" or retry_value == \"\":",
    "    target_num = str(random.randint(1,3))",
    "",
    "    print(\"1. 가위 / 2. 바위 / 3. 보\")",
    "    input_num = input(\"번호를 선택하세요. : \")",
    "    while int(input_num) < 1 or int(input_num) > 3:",
    "        print(\"1 부터 3 까지의 숫자만 입력 가능합니다.\")",
    "        input_num = input(\"번호를 선택하세요. : \")",
    "",
    "",
    "    print()",
    "    print(\"[게임 결과]\")",
    "    print(f\"{player_name}: {game_data[input_num]}  vs  컴퓨터: {game_data[target_num]}\")",
    "",
    "    game_result = \"\"",
    "",
    "    if game_data[input_num] == \"가위\": # 내가 가위를 낸 경우의 수",
    "        if game_data[target_num] == \"보\":",
    "            game_result = \"승리\"",
    "            win_cnt += 1",
    "            winning_streak_cnt +=1",
    "        elif game_data[target_num] == \"바위\":",
    "            game_result = \"패배\"",
    "            lose_cnt += 1",
    "            winning_streak_cnt = 0",
    "        else:",
    "            game_result = \"비김\"",
    "            winning_streak_cnt = 0",
    "    elif game_data[input_num] == \"바위\": # 내가 바위를 낸 경우의 수",
    "        if game_data[target_num] == \"가위\":",
    "            game_result = \"승리\"",
    "            win_cnt += 1",
    "            winning_streak_cnt += 1",
    "        elif game_data[target_num] == \"보\":",
    "            game_result = \"패배\"",
    "            lose_cnt += 1",
    "            winning_streak_cnt = 0",
    "        else:",
    "            game_result = \"비김\"",
    "            winning_streak_cnt = 0",
    "    else: # 내가 보를 낸 경우의 수",
    "        if game_data[target_num] == \"바위\":",
    "            game_result = \"승리\"",
    "            win_cnt += 1",
    "            winning_streak_cnt += 1",
    "        elif game_data[target_num] == \"가위\":",
    "            game_result = \"패배\"",
    "            lose_cnt += 1",
    "            winning_streak_cnt = 0",
    "        else:",
    "            game_result = \"비김\"",
    "            winning_streak_cnt = 0",
    "    print(f'=> {game_result}')",
    "",
    "    game_record_list.append(game_result)",
    "",
    "    print()",
    "",
    "    if win_cnt == 2 or lose_cnt == 2: # 3판 2선제 적용 및 승패 목록 출력",
    "        print(f\"최종 스코어\\t{player_name} {win_cnt} : {lose_cnt} 컴퓨터\")",
    "        print(f\"승패 목록 : {game_record_list}\")",
    "        break",
    "",
    "    print(f\"현재 스코어\\t{player_name} {win_cnt} : {lose_cnt} 컴퓨터\")",
    "    print(f\"현재 연승 카운트 : {winning_streak_cnt}\")",
    "    print()",
    "",
    "    retry_value = input(\"다시 도전 (yes/no) : \")",
    "",
    "    if retry_value == \"no\":",
    "        print(\"bye bye\")",
    "        print(f\"승패 목록 : {game_record_list}\")",
    "",
    "    while retry_value != \"yes\" and retry_value != \"no\":",
    "        print(\"yes 혹은 no 만 입력해주세요.\")",
    "        retry_value = input(\"다시 도전 (yes/no) : \")"
  ],
  "steps": [
    {
      "title": "되풀이 찾기",
      "say": "잘못 넣으면 다시 묻는 while 이 번호 입력과 재도전 입력, 두 곳에 같은 모양으로 있어요. 이걸 함수 하나로 꺼낼 거예요.",
      "ops": [
        {
          "mark": [
            "    while int(input_num) < 1 or int(input_num) > 3:",
            "        input_num = input(\"번호를 선택하세요. : \")"
          ]
        },
        {
          "mark": [
            "    while retry_value != \"yes\" and retry_value != \"no\":",
            "        retry_value = input(\"다시 도전 (yes/no) : \")"
          ]
        }
      ]
    },
    {
      "title": "ask 함수 만들기",
      "say": "질문, 허락된 답 목록, 안내 문구를 받아서 허락된 답이 나올 때까지 다시 묻는 함수예요. 숫자로 바꾸지 않고 문자열 그대로 검사하니 abc 나 01 도 걸러져요.",
      "ops": [
        {
          "after": "game_data = {\"1\":\"가위\", \"2\":\"바위\", \"3\":\"보\"}",
          "lines": [
            "",
            "",
            "def ask(prompt, allowed, warning):",
            "    answer = input(prompt).strip()",
            "    while answer not in allowed:",
            "        print(warning)",
            "        answer = input(prompt).strip()",
            "    return answer"
          ]
        }
      ]
    },
    {
      "title": "번호 입력에 ask",
      "say": "번호 입력의 네 줄이 ask 한 줄이 돼요. 허락된 답은 \"1\", \"2\", \"3\" 셋뿐이에요.",
      "ops": [
        {
          "replace": [
            "    input_num = input(\"번호를 선택하세요. : \")",
            "        input_num = input(\"번호를 선택하세요. : \")"
          ],
          "lines": [
            "    input_num = ask(\"번호를 선택하세요. : \", [\"1\", \"2\", \"3\"], \"1 부터 3 까지의 숫자만 입력 가능합니다.\")"
          ]
        }
      ]
    },
    {
      "title": "재도전에 ask",
      "say": "같은 ask 를 재도전 입력에도 다시 써요. 이게 재사용이에요. 다시 물어서 받은 no 도 bye bye 를 찍고 끝나도록 break 를 붙였어요.",
      "ops": [
        {
          "replace": [
            "    retry_value = input(\"다시 도전 (yes/no) : \")",
            "        retry_value = input(\"다시 도전 (yes/no) : \")"
          ],
          "lines": [
            "    retry_value = ask(\"다시 도전 (yes/no) : \", [\"yes\", \"no\"], \"yes 혹은 no 만 입력해주세요.\")",
            "    if retry_value == \"no\":",
            "        print(\"bye bye\")",
            "        print(f\"승패 목록 : {game_record_list}\")",
            "        break"
          ]
        }
      ]
    },
    {
      "title": "while True 로",
      "say": "끝내는 일은 이제 break 가 맡아요. 그래서 반복 조건은 while True 로 두고, 첫 판을 위해 만들던 retry_value = \"\" 도 필요 없어졌어요.",
      "ops": [
        {
          "replace": [
            "retry_value = \"\" # 재도전 여부",
            "retry_value = \"\" # 재도전 여부"
          ],
          "lines": []
        },
        {
          "replace": [
            "while retry_value == \"yes\" or retry_value == \"\":",
            "while retry_value == \"yes\" or retry_value == \"\":"
          ],
          "lines": [
            "while True:"
          ]
        }
      ]
    },
    {
      "title": "judge 함수 만들기",
      "say": "무엇이 무엇을 이기는지 beats 딕셔너리 한 줄로 적어요. judge 는 두 손을 받아 승리, 패배, 비김 중 하나를 돌려줘요.",
      "ops": [
        {
          "after": "    return answer",
          "lines": [
            "",
            "",
            "beats = {\"가위\": \"보\", \"바위\": \"가위\", \"보\": \"바위\"}  # 키가 값을 이긴다",
            "",
            "",
            "def judge(me, computer):",
            "    if me == computer:",
            "        return \"비김\"",
            "    if beats[me] == computer:",
            "        return \"승리\"",
            "    return \"패배\"",
            ""
          ]
        }
      ]
    },
    {
      "title": "if 세 벌을 judge 로",
      "say": "가위, 바위, 보마다 있던 if 세 벌이 judge 한 번이 돼요. 점수 올리기도 결과에 따라 한 번만 처리해서 아홉 갈래가 세 갈래로 줄어요.",
      "ops": [
        {
          "replace": [
            "    game_result = \"\"",
            "            winning_streak_cnt = 0\n    print(f'=> {game_result}')"
          ],
          "lines": [
            "    game_result = judge(game_data[input_num], game_data[target_num])",
            "    if game_result == \"승리\":",
            "        win_cnt += 1",
            "        winning_streak_cnt += 1",
            "    elif game_result == \"패배\":",
            "        lose_cnt += 1",
            "        winning_streak_cnt = 0",
            "    else:",
            "        winning_streak_cnt = 0"
          ]
        }
      ]
    },
    {
      "title": "이름 붙이기",
      "say": "game_data[input_num] 처럼 같은 식을 여러 번 쓰던 곳에 me, computer 라는 이름을 붙여요. 읽는 사람이 무엇인지 바로 알아요.",
      "ops": [
        {
          "replace": [
            "    target_num = str(random.randint(1,3))",
            "    target_num = str(random.randint(1,3))"
          ],
          "lines": [
            "    computer = game_data[str(random.randint(1, 3))]"
          ]
        },
        {
          "replace": [
            "    input_num = ask(\"번호를 선택하세요. : \", [\"1\", \"2\", \"3\"], \"1 부터 3 까지의 숫자만 입력 가능합니다.\")",
            "    input_num = ask(\"번호를 선택하세요. : \", [\"1\", \"2\", \"3\"], \"1 부터 3 까지의 숫자만 입력 가능합니다.\")"
          ],
          "lines": [
            "    num = ask(\"번호를 선택하세요. : \", [\"1\", \"2\", \"3\"], \"1 부터 3 까지의 숫자만 입력 가능합니다.\")",
            "    me = game_data[num]"
          ]
        },
        {
          "replace": [
            "    print(f\"{player_name}: {game_data[input_num]}  vs  컴퓨터: {game_data[target_num]}\")",
            "    print(f\"{player_name}: {game_data[input_num]}  vs  컴퓨터: {game_data[target_num]}\")"
          ],
          "lines": [
            "    print(f\"{player_name}: {me}  vs  컴퓨터: {computer}\")"
          ]
        },
        {
          "replace": [
            "    game_result = judge(game_data[input_num], game_data[target_num])",
            "    game_result = judge(game_data[input_num], game_data[target_num])"
          ],
          "lines": [
            "    game_result = judge(me, computer)"
          ]
        }
      ]
    }
  ],
  "doneSay": "같은 입력과 같은 컴퓨터 손으로 돌려 보면 원래 코드와 출력이 똑같아요. 01, abc 같은 잘못된 입력은 이제 다시 물어요."
};
