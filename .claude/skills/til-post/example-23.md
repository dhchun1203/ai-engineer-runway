## 1. 오늘의 흐름

공부 시간 5개 케이스로 선형회귀를 다시 해 보고, 모델이 그 직선을 어떻게 찾아가는지(경사하강법) 봤다. 같은 답(기울기 10, 절편 35)을 `LinearRegression`은 한 번에 계산하고, `SGDRegressor`는 손실을 줄이며 1000번 걸어서 찾아간다. 끝으로 특징이 셋인 다중 선형회귀를 위해 상관계수부터 그렸다.

1. `LinearRegression`: 한 번에 계산 → 기울기 10, 절편 35, 6시간 95점
2. 채점: MAE 1.60, MSE 3.20, R² 0.98
3. 손실 함수(MSE)를 줄이는 쪽으로 한 걸음씩 → `SGDRegressor`, `partial_fit` 1000 epoch
4. 학습 곡선: MSE, 기울기, 절편이 epoch마다 어떻게 변하나
5. 다중 선형회귀 준비: 산점도 세 개, 상관계수 히트맵

## 2. 구조

```txt
데이터          hours 1~5 → scores 47, 53, 65, 73, 87 (5개 케이스)
입력 / 정답     X = df[["hours"]] (2차원, 독립변수)
                y = df["scores"]  (1차원, 종속변수)

한 번에 풀기    LinearRegression().fit(X, y)
                → coef_[0] = 10, intercept_ = 35

한 걸음씩 풀기  SGDRegressor(eta0=0.01)
                for 1000번: partial_fit(X, y)   # 1번 = 1 epoch
                → coef_[0] = 10.13, intercept_[0] = 34.74

채점            MAE, MSE(= 손실 함수), R²
다중 회귀 준비  df.corr() → sns.heatmap
```

## 3. 코드

### 선형회귀 복습

```python
data = {
    "hours": [1, 2, 3, 4, 5],
    "scores": [47, 53, 65, 73, 87]
}
df = pd.DataFrame(data)

# 입력(Feature)은 2차원, 정답(Target)은 1차원
X = df[["hours"]]
y = df["scores"]

model = LinearRegression()
model.fit(X, y)

# coef_는 특징마다 하나씩이라 배열 → [0]
print(f"기울기: {model.coef_[0]:.2f}")
print(f"절편: {model.intercept_:.2f}")

# 새 입력도 같은 열 이름의 표로
new_data = pd.DataFrame({"hours": [6]})
predicted_score = model.predict(new_data)
print(f"예상 성적: {predicted_score[0]:.2f}점")
```

### 채점

```python
y_pred = model.predict(X)

# 오차 절댓값의 평균: 평균 몇 점 틀리나
mae = mean_absolute_error(y, y_pred)

# 오차 제곱의 평균: 큰 오차에 민감
mse = mean_squared_error(y, y_pred)

# 1에 가까울수록 잘 맞음, 음수면 학습 실패
r2 = r2_score(y, y_pred)
```

### 경사하강법 (SGDRegressor)

```python
sgd = SGDRegressor(
    loss="squared_error",       # 손실 = 제곱 오차
    learning_rate="constant",   # 학습률을 끝까지 같게
    eta0=0.01,                  # 학습률(한 걸음 크기)
    max_iter=1000,              # fit()용, partial_fit은 안 씀
    shuffle=False,              # 순서 섞지 않음
    random_state=42
)

history = []
for epoch in range(1000):
    # 데이터 전체 한 바퀴 = 1 epoch
    sgd.partial_fit(X, y)

    y_pred = sgd.predict(X)
    history.append({
        "epoch": epoch + 1,
        "weight": sgd.coef_[0],
        "bias": sgd.intercept_[0],
        "mse": mean_squared_error(y, y_pred)
    })

history_df = pd.DataFrame(history)

steps = [1, 5, 10, 50, 100, 300, 500, 1000]
history_df[history_df["epoch"].isin(steps)]
```

### 학습 곡선

```python
plt.figure(figsize=(10, 5))
plt.plot(history_df["epoch"], history_df["mse"],
         color="blue", label="학습 손실(Training Loss)")
plt.xlabel("Epoch")
plt.ylabel("MSE")
plt.grid(alpha=0.3)
plt.legend()
plt.show()

# 1행 2열: 왼쪽 기울기, 오른쪽 절편
fig, axes = plt.subplots(1, 2, figsize=(12, 5))
axes[0].plot(history_df["epoch"], history_df["weight"])
axes[0].set_ylabel("Weight")
axes[1].plot(history_df["epoch"], history_df["bias"])
axes[1].set_ylabel("Bias")
plt.show()
```

### 다중 선형회귀 준비

```python
df = pd.DataFrame({
    "study_hours":    [1, 2, 3, 4, 5, 2, 3, 5, 4, 1],
    "sleep_hours":    [6, 8, 5, 7, 8, 5, 8, 6, 6, 8],
    "practice_count": [10, 15, 20, 25, 30, 12, 28, 22, 32, 8],
    "score":          [47, 58, 60, 76, 87, 49, 73, 77, 79, 52]
})

# 1행 3열에 특징마다 산점도
fig, axes = plt.subplots(1, 3, figsize=(16, 5))
sns.scatterplot(data=df, x="study_hours", y="score", ax=axes[0])
sns.scatterplot(data=df, x="sleep_hours", y="score", ax=axes[1])
sns.scatterplot(data=df, x="practice_count", y="score", ax=axes[2])
plt.show()

# 모든 열 쌍의 상관계수를 색으로
plt.rcParams["axes.unicode_minus"] = False
sns.heatmap(df.corr(), annot=True, vmin=-1, vmax=1, fmt=".2f")
plt.show()
```

## 4. 핵심 정리

| 개념 | 내 말로 |
| --- | --- |
| 독립변수 / 종속변수 | 예측에 쓰는 입력(공부 시간) / 예측하려는 정답(점수) |
| 손실 함수 | 틀린 정도를 숫자 하나로. 선형회귀는 MSE = (1/n) × Σ(y − ŷ)² |
| 경사하강법 | w, b를 아무 값에서 시작해 손실이 줄어드는 방향으로 조금씩 고치기를 반복 |
| 학습률 (`eta0`) | 한 걸음의 크기. 작으면 느리고, 크면 바닥을 지나친다 |
| BGD | 전체 데이터로 기울기를 구해 한 걸음. 정확하지만 데이터가 크면 무겁다 |
| SGD | 데이터 1개씩 보고 바로 한 걸음. 빠르지만 조금씩 흔들린다 |
| epoch | 데이터 전체를 한 바퀴. `partial_fit` 한 번 = 1 epoch |
| 다중 선형회귀 | 특징이 여러 개. 특징마다 기울기가 하나씩 생긴다 |

- MAE, MSE는 손으로도 셀 수 있다. 오차 2, -2, 0, -2, 2 → MAE = 8 ÷ 5 = 1.6, MSE = 16 ÷ 5 = 3.2
- SGD 1 epoch를 손으로 따라가 봤다. w, b = 0에서 시작해 케이스 하나마다 `error = 예측 - 정답`, `w -= 0.01 × error × x`, `b -= 0.01 × error`. 첫 케이스(1시간, 47점)에서 오차 -47 → w, b가 0.47씩 올라간다. 5개를 다 돌면 8.455, 2.731로 sklearn 결과와 같다
- 기울기는 처음 8 epoch 만에 17까지 치솟았다가 10으로 내려온다. 절편이 0 근처라 기울기를 키워서 점들을 따라잡으려 한 것
- 학습률을 0.001로 줄이면 1000 epoch 뒤에도 기울기 13.53, 절편 22.17, MSE 33.13. 걸음 크기와 걸음 수를 함께 정해야 한다
- 상관계수: 공부 시간 0.93, 문제 풀이 0.93, 수면 0.29. 공부 시간과 문제 풀이끼리도 0.85라 비슷한 정보다

## 5. 헷갈린 점, 고친 점

- `X = df["hours"]`(한 겹)로 학습하면 `ValueError: Expected a 2-dimensional container but got <class 'pandas.Series'> instead.` 입력은 꼭 `df[["hours"]]`
- 수업 노트에 "6시간 학습 96점"이라고 적었는데 `10 × 6 + 35 = 95`가 맞다
- 손실 그래프 가로축은 epoch인데 수업 코드는 `xlabel("Loss")`였다. `label`을 줬으면 `legend()`도 불러야 범례가 나온다
- 히트맵을 그리면 `UserWarning: Glyph 8722 (\N{MINUS SIGN}) missing from font(s) AppleGothic.` 색 막대의 음수 눈금에 쓰는 마이너스 기호가 AppleGothic에 없어서다. `plt.rcParams["axes.unicode_minus"] = False`로 해결
- `max_iter=1000`은 `fit()`이 최대 몇 바퀴 돌지 정하는 값이다. `partial_fit`은 부를 때마다 한 바퀴만 돈다. 같은 설정으로 `sgd.fit(X, y)`를 부르면 427바퀴째에 스스로 멈추고 10.31, 34.04가 나온다
- 학습 칸을 두 번 실행하면 이어서 배워 숫자가 달라진다. 모델 만드는 칸부터 다시 실행

## 6. 실행 예시

```txt
기울기: 10.00
절편: 35.00
6시간 학습한 학생의 예상 성적: 95.00점
학습 데이터에 대한 예측값: [45. 55. 65. 75. 85.]
학습데이터에 대한 평균 절대 오차(MAE): 1.60
학습데이터에 대한 평균 제곱 오차(MSE): 3.20
학습데이터에 대한 결정 계수(R^2): 0.98
```

```txt
     epoch     weight       bias          mse
0        1   8.455225   2.731163  1369.816039
4        5  16.728403   6.216494   167.673523
9       10  17.060518   7.615610   141.377004
49      50  15.031795  15.629821    72.111791
99     100  13.294764  22.401342    32.278720
299    300  10.678818  32.599172     4.254356
499    500  10.223895  34.372614     3.302220
999   1000  10.129335  34.741238     3.250159
```

```txt
기울기(w): 10.13
절편(b): 34.74
예측 성적: 95.52점
```

```txt
                study_hours  sleep_hours  practice_count  score
study_hours            1.00         0.00            0.85   0.93
sleep_hours            0.00         1.00            0.14   0.29
practice_count         0.85         0.14            1.00   0.93
score                  0.93         0.29            0.93   1.00
```
