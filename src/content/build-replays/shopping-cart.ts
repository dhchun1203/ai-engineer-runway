// 12회차 쇼핑몰 장바구니 미니 프로젝트를 빈 파일에서 한 단계씩 쌓아 가는 재생기 데이터.
// blocks는 완성 코드의 조각이고, from 단계에 나타나 until 단계에 사라진다(1부터).
// steps[i].run과 state는 i+1단계까지의 코드를 실제로 파이썬으로 실행해서 뽑은 값이다
// (마지막 단계는 발제의 실행 예시 입력 그대로, 2026-11-10 확인).
import type { BuildReplayData } from "./types";

export const shoppingCart: BuildReplayData = {
  "file": "shopping_cart.py",
  "blocks": [
    {
      "from": 1,
      "lines": [
        "# ===== 1. 상품 =====",
        "class Product:"
      ]
    },
    {
      "from": 2,
      "lines": [
        "    next_number = 1   # 클래스 변수: 다음에 줄 번호 (발급기)",
        ""
      ]
    },
    {
      "from": 1,
      "lines": [
        "    def __init__(self, name, price, stock):"
      ]
    },
    {
      "from": 2,
      "lines": [
        "        self.number = Product.next_number   # ① 현재 번호를 내 번호표로",
        "        Product.next_number += 1            # ② 발급기 번호 올리기"
      ]
    },
    {
      "from": 1,
      "lines": [
        "        self.name = name",
        "        self.price = price"
      ]
    },
    {
      "from": 1,
      "until": 3,
      "lines": [
        "        self.stock = stock"
      ]
    },
    {
      "from": 3,
      "lines": [
        "        self.__stock = stock   # 재고: 밖에서 직접 못 바꾸게 숨김"
      ]
    },
    {
      "from": 3,
      "lines": [
        "",
        "    def get_stock(self):",
        "        return self.__stock",
        "",
        "    def decrease_stock(self, qty):   # 재고는 이 메서드로만 줄인다",
        "        if qty > self.__stock:",
        "            print(\"재고보다 많이 줄일 수 없습니다.\")",
        "            return",
        "        self.__stock -= qty"
      ]
    },
    {
      "from": 4,
      "lines": [
        "",
        "    def line_text(self):   # 상품목록의 한 줄",
        "        if self.__stock == 0:",
        "            stock_text = \"(품절)\"",
        "        else:",
        "            stock_text = f\"(재고 {self.__stock}개)\"",
        "        return f\"{self.number}. {self.name}\\t{self.price:,}원  {stock_text}\""
      ]
    },
    {
      "from": 5,
      "lines": [
        "",
        "",
        "# ===== 2. 장바구니 한 줄 =====",
        "class CartLine:",
        "    def __init__(self, item, qty):",
        "        self.item = item   # 상품 객체를 가리킴 (조합)",
        "        self.qty = qty     # 담은 수량 (재고와 별개)",
        "",
        "    def subtotal(self):",
        "        return self.item.price * self.qty"
      ]
    },
    {
      "from": 8,
      "lines": [
        "",
        "",
        "# ===== 3. 쿠폰 =====",
        "class Discount:   # 부모: 쿠폰 없음",
        "    name = \"쿠폰 없음\"",
        "",
        "    def discount_amount(self, total):",
        "        return 0"
      ]
    },
    {
      "from": 9,
      "lines": [
        "",
        "",
        "class RateDiscount(Discount):   # 상속",
        "    def __init__(self, rate, max_amount):",
        "        self.rate = rate",
        "        self.max_amount = max_amount",
        "        self.name = f\"{int(rate * 100)}% 할인 (최대 {max_amount:,}원)\"",
        "",
        "    def discount_amount(self, total):   # 오버라이딩",
        "        amount = int(total * self.rate)   # 원 단위 미만 버림",
        "        return min(amount, self.max_amount)"
      ]
    },
    {
      "from": 10,
      "lines": [
        "",
        "",
        "class FixedDiscount(Discount):   # 상속",
        "    def __init__(self, amount, min_total):",
        "        self.amount = amount",
        "        self.min_total = min_total",
        "        self.name = f\"{amount:,}원 할인 ({min_total:,}원 이상 구매 시)\"",
        "",
        "    def discount_amount(self, total):   # 오버라이딩",
        "        if total >= self.min_total:",
        "            return self.amount",
        "        return 0"
      ]
    },
    {
      "from": 6,
      "lines": [
        "",
        "",
        "# ===== 4. 장바구니 =====",
        "class Cart:",
        "    def __init__(self):",
        "        self.lines = []   # CartLine 객체들"
      ]
    },
    {
      "from": 8,
      "lines": [
        "        self.coupon = Discount()   # 처음엔 쿠폰 없음"
      ]
    },
    {
      "from": 6,
      "lines": [
        "",
        "    def find_line(self, item):   # 이 상품이 담긴 줄 찾기",
        "        for line in self.lines:",
        "            if line.item is item:",
        "                return line",
        "        return None",
        "",
        "    def add(self, item, qty):",
        "        line = self.find_line(item)",
        "        in_cart = line.qty if line else 0",
        "        can_add = item.get_stock() - in_cart   # 재고 - 이미 담은 수량",
        "        if qty > can_add:",
        "            print(f\"재고가 부족합니다. (담을 수 있는 수량: {can_add}개)\")",
        "            return",
        "        if line:",
        "            line.qty += qty   # 이미 있으면 수량만 더함",
        "        else:",
        "            self.lines.append(CartLine(item, qty))",
        "        print(f\"{item.name} {qty}개를 담았습니다.\")"
      ]
    },
    {
      "from": 7,
      "lines": [
        "",
        "    def remove(self, item):",
        "        line = self.find_line(item)",
        "        if line is None:",
        "            print(\"장바구니에 없는 상품입니다.\")",
        "            return",
        "        self.lines.remove(line)",
        "        print(f\"{item.name}을(를) 장바구니에서 뺐습니다.\")",
        "",
        "    def item_total(self):   # ① 상품 합계",
        "        return sum([line.subtotal() for line in self.lines])"
      ]
    },
    {
      "from": 8,
      "lines": [
        "",
        "    def set_coupon(self, coupon):",
        "        self.coupon = coupon"
      ]
    },
    {
      "from": 11,
      "lines": [
        "",
        "    def discount(self):   # ② 할인 (쿠폰 종류는 묻지 않음)",
        "        return self.coupon.discount_amount(self.item_total())",
        "",
        "    def shipping_fee(self):   # ③ 배송비",
        "        if len(self.lines) == 0:",
        "            return 0",
        "        if self.item_total() - self.discount() >= 30000:",
        "            return 0",
        "        return 3000",
        "",
        "    def pay_amount(self):   # ④ 결제 금액",
        "        return self.item_total() - self.discount() + self.shipping_fee()",
        "",
        "    def show(self):",
        "        print(\"-\" * 40)",
        "        for line in self.lines:",
        "            print(f\"{line.item.name}\\tx {line.qty}\\t{line.subtotal():>10,}원\")",
        "        print(\"-\" * 40)",
        "        print(f\"상품 합계\\t\\t{self.item_total():>10,}원\")",
        "        print(f\"할인\\t\\t\\t{-self.discount():>10,}원  [{self.coupon.name}]\")",
        "        print(f\"배송비\\t\\t\\t{self.shipping_fee():>10,}원\")",
        "        print(f\"결제 금액\\t\\t{self.pay_amount():>10,}원\")",
        "        print(\"-\" * 40)"
      ]
    },
    {
      "from": 12,
      "lines": [
        "",
        "    def checkout(self):",
        "        if len(self.lines) == 0:",
        "            print(\"장바구니가 비어 있습니다.\")",
        "            return",
        "        print(\"[영수증]\")",
        "        self.show()",
        "        for line in self.lines:",
        "            line.item.decrease_stock(line.qty)   # 재고는 결제할 때만 줄어든다",
        "        self.lines = []             # 장바구니 비우기",
        "        self.coupon = Discount()    # 쿠폰 초기화",
        "        print(\"결제가 완료되었습니다. 감사합니다!\")"
      ]
    },
    {
      "from": 13,
      "lines": [
        "",
        "",
        "# ===== 5. 시작 데이터 =====",
        "products = [",
        "    Product(\"무선 이어폰\", 89000, 3),",
        "    Product(\"텀블러\", 15000, 10),",
        "    Product(\"보조배터리\", 32000, 5),",
        "    Product(\"마우스패드\", 9000, 0),",
        "    Product(\"USB 허브\", 18000, 4),",
        "]",
        "coupons = [",
        "    Discount(),",
        "    RateDiscount(rate=0.1, max_amount=5000),",
        "    FixedDiscount(amount=3000, min_total=20000),",
        "]",
        "cart = Cart()",
        "",
        "",
        "# ===== 6. 입력 도우미 =====",
        "def ask_number(message, max_number):   # 1 ~ max_number 번호만",
        "    while True:",
        "        answer = input(message).strip()",
        "        if answer.isdigit() and 1 <= int(answer) <= max_number:",
        "            return int(answer)",
        "        print(f\"1~{max_number} 사이의 번호를 입력하세요.\")",
        "",
        "",
        "def ask_int(message):   # 1 이상의 숫자만",
        "    while True:",
        "        answer = input(message).strip()",
        "        if answer.isdigit() and int(answer) > 0:",
        "            return int(answer)",
        "        print(\"1 이상의 숫자를 입력하세요.\")",
        "",
        "",
        "# ===== 7. 메뉴 =====",
        "def main():",
        "    while True:",
        "        print(\"-\" * 50)",
        "        print(\"1.상품목록 2.담기 3.빼기 4.장바구니 5.쿠폰 6.결제 q.종료\")",
        "        print(\"-\" * 50)",
        "        choice = input(\"선택: \").strip()",
        "",
        "        if choice == \"1\":",
        "            for product in products:",
        "                print(product.line_text())",
        "        elif choice == \"2\":",
        "            product = products[ask_number(\"상품 번호: \", len(products)) - 1]",
        "            if product.get_stock() == 0:",
        "                print(\"품절된 상품입니다.\")",
        "                continue",
        "            cart.add(product, ask_int(\"수량: \"))",
        "        elif choice == \"3\":",
        "            product = products[ask_number(\"상품 번호: \", len(products)) - 1]",
        "            cart.remove(product)",
        "        elif choice == \"4\":",
        "            cart.show()",
        "        elif choice == \"5\":",
        "            for number, coupon in enumerate(coupons, start=1):",
        "                print(f\"{number}. {coupon.name}\")",
        "            coupon = coupons[ask_number(\"쿠폰 번호: \", len(coupons)) - 1]",
        "            cart.set_coupon(coupon)",
        "            print(f\"[{coupon.name}] 쿠폰을 적용했습니다.\")",
        "        elif choice == \"6\":",
        "            cart.checkout()",
        "        elif choice == \"q\":",
        "            print(\"종료합니다.\")",
        "            break",
        "        else:",
        "            print(\"메뉴 항목 중 하나를 선택해주세요.\")",
        "",
        "",
        "if __name__ == \"__main__\":",
        "    main()"
      ]
    }
  ],
  "steps": [
    {
      "short": "상품 틀",
      "title": "상품 클래스부터",
      "concept": "클래스, 인스턴스 변수",
      "group": "product",
      "say": "가게에 있는 상품 정보를 담는 틀이에요. 재고는 `stock` 하나만 두고, 장바구니에 담은 수량은 여기 두지 않아요. 재고와 담은 수량을 `qty` 하나에 섞으면 숫자가 서로 덮어써지기 때문이에요.",
      "think": {
        "q": "담은 수량을 `Product`에 두면 왜 안 될까요?",
        "a": "상품 객체 하나가 상품 목록과 장바구니 양쪽에서 같은 객체로 쓰여요. 속성 하나에 두 뜻을 담으면 한쪽을 바꿀 때 다른 쪽도 같이 바뀌어요."
      },
      "run": [
        {
          "code": "tumbler = products[1]",
          "out": ""
        },
        {
          "code": "print(tumbler.name, tumbler.price, tumbler.stock)",
          "out": "텀블러 15000 10"
        }
      ],
      "state": {
        "nextNumber": null,
        "products": [
          {
            "number": null,
            "name": "무선 이어폰",
            "price": 89000,
            "stock": 3,
            "hidden": false,
            "listed": false
          },
          {
            "number": null,
            "name": "텀블러",
            "price": 15000,
            "stock": 10,
            "hidden": false,
            "listed": false
          },
          {
            "number": null,
            "name": "보조배터리",
            "price": 32000,
            "stock": 5,
            "hidden": false,
            "listed": false
          },
          {
            "number": null,
            "name": "마우스패드",
            "price": 9000,
            "stock": 0,
            "hidden": false,
            "listed": false
          },
          {
            "number": null,
            "name": "USB 허브",
            "price": 18000,
            "stock": 4,
            "hidden": false,
            "listed": false
          }
        ],
        "holder": null,
        "lines": [],
        "coupon": null,
        "totals": null
      }
    },
    {
      "short": "자동 번호",
      "title": "번호를 자동으로 붙이기",
      "concept": "클래스 변수",
      "group": "product",
      "say": "`next_number`는 모든 상품이 함께 보는 번호표 발급기예요. `__init__`에서 지금 값을 `self.number`에 저장하고, 그다음 발급기를 1 올려요. 상품을 5개 만들면 발급기는 6을 가리켜요.",
      "think": {
        "q": "①과 ② 두 줄의 순서를 바꾸면 첫 상품의 번호는 몇 번이 될까요?",
        "a": "2번이에요. 발급기를 먼저 올린 뒤 저장하기 때문이에요. 순서를 바꿔 실제로 실행해 확인했어요."
      },
      "run": [
        {
          "code": "print([p.number for p in products])",
          "out": "[1, 2, 3, 4, 5]"
        },
        {
          "code": "print(Product.next_number)",
          "out": "6"
        }
      ],
      "state": {
        "nextNumber": 6,
        "products": [
          {
            "number": 1,
            "name": "무선 이어폰",
            "price": 89000,
            "stock": 3,
            "hidden": false,
            "listed": false
          },
          {
            "number": 2,
            "name": "텀블러",
            "price": 15000,
            "stock": 10,
            "hidden": false,
            "listed": false
          },
          {
            "number": 3,
            "name": "보조배터리",
            "price": 32000,
            "stock": 5,
            "hidden": false,
            "listed": false
          },
          {
            "number": 4,
            "name": "마우스패드",
            "price": 9000,
            "stock": 0,
            "hidden": false,
            "listed": false
          },
          {
            "number": 5,
            "name": "USB 허브",
            "price": 18000,
            "stock": 4,
            "hidden": false,
            "listed": false
          }
        ],
        "holder": null,
        "lines": [],
        "coupon": null,
        "totals": null
      }
    },
    {
      "short": "재고 숨기기",
      "title": "재고는 메서드로만 바꾸기",
      "concept": "캡슐화, 이름 변형",
      "group": "product",
      "say": "`self.stock`을 `self.__stock`으로 바꿔요. 이제 밖에서 `상품.__stock`으로는 닿지 않아요. 재고는 `get_stock()`으로 읽고 `decrease_stock()`으로만 줄여요. 재고보다 많이 줄이는 실수는 이 메서드 한 곳에서 막아요.",
      "think": {
        "q": "밖에서 `products[1].__stock = 0`을 실행하면 재고가 0이 될까요?",
        "a": "아니요. 그 객체에 `__stock`이라는 새 속성이 하나 생길 뿐이고, 진짜 재고인 `_Product__stock`은 10 그대로예요. 실제로 실행해 확인했어요."
      },
      "run": [
        {
          "code": "tumbler = products[1]",
          "out": ""
        },
        {
          "code": "print(tumbler.get_stock())",
          "out": "10"
        },
        {
          "code": "tumbler.decrease_stock(20)",
          "out": "재고보다 많이 줄일 수 없습니다."
        },
        {
          "code": "print(tumbler.__stock)",
          "out": "AttributeError: 'Product' object has no attribute '__stock'",
          "error": true
        }
      ],
      "state": {
        "nextNumber": 6,
        "products": [
          {
            "number": 1,
            "name": "무선 이어폰",
            "price": 89000,
            "stock": 3,
            "hidden": true,
            "listed": false
          },
          {
            "number": 2,
            "name": "텀블러",
            "price": 15000,
            "stock": 10,
            "hidden": true,
            "listed": false
          },
          {
            "number": 3,
            "name": "보조배터리",
            "price": 32000,
            "stock": 5,
            "hidden": true,
            "listed": false
          },
          {
            "number": 4,
            "name": "마우스패드",
            "price": 9000,
            "stock": 0,
            "hidden": true,
            "listed": false
          },
          {
            "number": 5,
            "name": "USB 허브",
            "price": 18000,
            "stock": 4,
            "hidden": true,
            "listed": false
          }
        ],
        "holder": null,
        "lines": [],
        "coupon": null,
        "totals": null
      }
    },
    {
      "short": "목록 한 줄",
      "title": "상품은 자기 한 줄을 만든다",
      "concept": "메서드, 책임 나누기",
      "group": "product",
      "say": "메뉴 1(상품목록)에 찍힐 한 줄을 상품이 직접 만들어요. 재고가 0이면 `(품절)`로 바꾸는 판단도 자기 재고를 아는 상품이 해요.",
      "think": {
        "q": "목록 전체를 찍는 반복문은 왜 `Product` 안에 넣지 않을까요?",
        "a": "상품 하나는 다른 상품을 몰라요. 여러 상품을 도는 일은 상품 리스트를 가진 쪽, 마지막 단계의 메뉴 코드가 해요."
      },
      "run": [
        {
          "code": "for p in products:\n    print(p.line_text())",
          "out": "1. 무선 이어폰\t89,000원  (재고 3개)\n2. 텀블러\t15,000원  (재고 10개)\n3. 보조배터리\t32,000원  (재고 5개)\n4. 마우스패드\t9,000원  (품절)\n5. USB 허브\t18,000원  (재고 4개)"
        }
      ],
      "state": {
        "nextNumber": 6,
        "products": [
          {
            "number": 1,
            "name": "무선 이어폰",
            "price": 89000,
            "stock": 3,
            "hidden": true,
            "listed": true
          },
          {
            "number": 2,
            "name": "텀블러",
            "price": 15000,
            "stock": 10,
            "hidden": true,
            "listed": true
          },
          {
            "number": 3,
            "name": "보조배터리",
            "price": 32000,
            "stock": 5,
            "hidden": true,
            "listed": true
          },
          {
            "number": 4,
            "name": "마우스패드",
            "price": 9000,
            "stock": 0,
            "hidden": true,
            "listed": true
          },
          {
            "number": 5,
            "name": "USB 허브",
            "price": 18000,
            "stock": 4,
            "hidden": true,
            "listed": true
          }
        ],
        "holder": null,
        "lines": [],
        "coupon": null,
        "totals": null
      }
    },
    {
      "short": "장바구니 한 줄",
      "title": "담은 수량은 따로 두기",
      "concept": "조합(has-a)",
      "group": "line",
      "say": "`CartLine`은 상품 객체를 `item`으로 가리키고, 담은 수량은 자기 `qty`에 둬요. 9개를 담아도 상품의 재고는 10 그대로예요. 아래 보드의 점선이 \"복사가 아니라 가리킨다\"는 뜻이에요.",
      "think": {
        "q": "`line.item.get_stock()`이 9가 아니라 10인 이유는 뭘까요?",
        "a": "`CartLine`은 상품을 복사하지 않고 가리키기만 해요. 담은 수량 9는 `line.qty`에만 들어가요."
      },
      "run": [
        {
          "code": "line = CartLine(products[1], 9)",
          "out": ""
        },
        {
          "code": "print(line.qty, line.item.get_stock())",
          "out": "9 10"
        },
        {
          "code": "print(line.subtotal())",
          "out": "135000"
        }
      ],
      "state": {
        "nextNumber": 6,
        "products": [
          {
            "number": 1,
            "name": "무선 이어폰",
            "price": 89000,
            "stock": 3,
            "hidden": true,
            "listed": true
          },
          {
            "number": 2,
            "name": "텀블러",
            "price": 15000,
            "stock": 10,
            "hidden": true,
            "listed": true
          },
          {
            "number": 3,
            "name": "보조배터리",
            "price": 32000,
            "stock": 5,
            "hidden": true,
            "listed": true
          },
          {
            "number": 4,
            "name": "마우스패드",
            "price": 9000,
            "stock": 0,
            "hidden": true,
            "listed": true
          },
          {
            "number": 5,
            "name": "USB 허브",
            "price": 18000,
            "stock": 4,
            "hidden": true,
            "listed": true
          }
        ],
        "holder": "line",
        "lines": [
          {
            "name": "텀블러",
            "number": 2,
            "qty": 9,
            "subtotal": 135000
          }
        ],
        "coupon": null,
        "totals": null
      }
    },
    {
      "short": "담기",
      "title": "담을 수 있는 수량 계산",
      "concept": "조합, is 비교",
      "group": "cart",
      "say": "담을 수 있는 수량은 재고에서 이미 담은 수량을 뺀 값이에요. 텀블러 재고 10에 9개가 담겨 있으면 1개까지만 돼요. 이미 담긴 상품이면 새 줄을 만들지 않고 `qty`만 더해요. `find_line`은 같은 상품 객체인지 `is`로 비교해요.",
      "think": {
        "q": "텀블러 9개가 담긴 상태에서 1개를 더 담으면 장바구니 줄은 몇 개일까요?",
        "a": "1개 그대로이고 그 줄의 `qty`가 10이 돼요. 10 - 9 = 1이라 담을 수 있고, 같은 상품이라 수량만 더해요. 실제로 실행해 확인했어요."
      },
      "run": [
        {
          "code": "cart.add(products[1], 9)",
          "out": "텀블러 9개를 담았습니다."
        },
        {
          "code": "cart.add(products[1], 2)",
          "out": "재고가 부족합니다. (담을 수 있는 수량: 1개)"
        },
        {
          "code": "cart.add(products[0], 2)",
          "out": "무선 이어폰 2개를 담았습니다."
        }
      ],
      "state": {
        "nextNumber": 6,
        "products": [
          {
            "number": 1,
            "name": "무선 이어폰",
            "price": 89000,
            "stock": 3,
            "hidden": true,
            "listed": true
          },
          {
            "number": 2,
            "name": "텀블러",
            "price": 15000,
            "stock": 10,
            "hidden": true,
            "listed": true
          },
          {
            "number": 3,
            "name": "보조배터리",
            "price": 32000,
            "stock": 5,
            "hidden": true,
            "listed": true
          },
          {
            "number": 4,
            "name": "마우스패드",
            "price": 9000,
            "stock": 0,
            "hidden": true,
            "listed": true
          },
          {
            "number": 5,
            "name": "USB 허브",
            "price": 18000,
            "stock": 4,
            "hidden": true,
            "listed": true
          }
        ],
        "holder": "cart",
        "lines": [
          {
            "name": "텀블러",
            "number": 2,
            "qty": 9,
            "subtotal": 135000
          },
          {
            "name": "무선 이어폰",
            "number": 1,
            "qty": 2,
            "subtotal": 178000
          }
        ],
        "coupon": null,
        "totals": null
      }
    },
    {
      "short": "빼기와 합계",
      "title": "빼기와 상품 합계",
      "concept": "리스트 컴프리헨션",
      "group": "cart",
      "say": "`remove`는 그 상품의 줄을 찾아 리스트에서 지워요. 상품 합계는 줄마다 `subtotal()`을 모아 더한 값으로, 규칙 3-4의 ①이에요.",
      "think": {
        "q": "합계를 변수에 저장해 두지 않고 부를 때마다 계산하면 좋은 점은 뭘까요?",
        "a": "담기나 빼기를 할 때마다 합계를 따로 고칠 필요가 없어서, 줄 목록과 합계가 어긋날 일이 없어요."
      },
      "run": [
        {
          "code": "print(cart.item_total())",
          "out": "313000"
        },
        {
          "code": "cart.remove(products[0])",
          "out": "무선 이어폰을(를) 장바구니에서 뺐습니다."
        },
        {
          "code": "print(cart.item_total())",
          "out": "135000"
        }
      ],
      "state": {
        "nextNumber": 6,
        "products": [
          {
            "number": 1,
            "name": "무선 이어폰",
            "price": 89000,
            "stock": 3,
            "hidden": true,
            "listed": true
          },
          {
            "number": 2,
            "name": "텀블러",
            "price": 15000,
            "stock": 10,
            "hidden": true,
            "listed": true
          },
          {
            "number": 3,
            "name": "보조배터리",
            "price": 32000,
            "stock": 5,
            "hidden": true,
            "listed": true
          },
          {
            "number": 4,
            "name": "마우스패드",
            "price": 9000,
            "stock": 0,
            "hidden": true,
            "listed": true
          },
          {
            "number": 5,
            "name": "USB 허브",
            "price": 18000,
            "stock": 4,
            "hidden": true,
            "listed": true
          }
        ],
        "holder": "cart",
        "lines": [
          {
            "name": "텀블러",
            "number": 2,
            "qty": 9,
            "subtotal": 135000
          }
        ],
        "coupon": null,
        "totals": null
      }
    },
    {
      "short": "쿠폰의 틀",
      "title": "모든 쿠폰의 공통 틀",
      "concept": "상속(부모 클래스)",
      "group": "coupon",
      "say": "부모 `Discount`가 \"모든 쿠폰은 `discount_amount(total)`을 가진다\"는 약속을 정해요. 부모 자체는 \"쿠폰 없음\"이라 항상 0원이에요. 장바구니는 이 쿠폰을 들고 시작하고, `set_coupon`으로 바꿔요.",
      "think": {
        "q": "\"쿠폰 없음\"을 `None` 대신 `Discount()` 객체로 두면 좋은 점은 뭘까요?",
        "a": "쿠폰이 없을 때도 `cart.coupon.discount_amount(...)`를 그대로 부를 수 있어서, \"쿠폰이 있나?\"를 매번 `if`로 검사하지 않아도 돼요."
      },
      "run": [
        {
          "code": "print(cart.coupon.name)",
          "out": "쿠폰 없음"
        },
        {
          "code": "print(cart.coupon.discount_amount(cart.item_total()))",
          "out": "0"
        }
      ],
      "state": {
        "nextNumber": 6,
        "products": [
          {
            "number": 1,
            "name": "무선 이어폰",
            "price": 89000,
            "stock": 3,
            "hidden": true,
            "listed": true
          },
          {
            "number": 2,
            "name": "텀블러",
            "price": 15000,
            "stock": 10,
            "hidden": true,
            "listed": true
          },
          {
            "number": 3,
            "name": "보조배터리",
            "price": 32000,
            "stock": 5,
            "hidden": true,
            "listed": true
          },
          {
            "number": 4,
            "name": "마우스패드",
            "price": 9000,
            "stock": 0,
            "hidden": true,
            "listed": true
          },
          {
            "number": 5,
            "name": "USB 허브",
            "price": 18000,
            "stock": 4,
            "hidden": true,
            "listed": true
          }
        ],
        "holder": "cart",
        "lines": [
          {
            "name": "텀블러",
            "number": 2,
            "qty": 9,
            "subtotal": 135000
          },
          {
            "name": "무선 이어폰",
            "number": 1,
            "qty": 2,
            "subtotal": 178000
          }
        ],
        "coupon": "쿠폰 없음",
        "totals": null
      }
    },
    {
      "short": "10% 쿠폰",
      "title": "10% 쿠폰과 오버라이딩",
      "concept": "상속, 오버라이딩",
      "group": "coupon",
      "say": "`RateDiscount`는 `Discount`를 물려받고 `discount_amount`만 다시 정의해요. `int()`로 원 단위 미만을 버리고 `min()`으로 5,000원을 넘지 않게 해요. `self.name`은 부모의 클래스 변수 `name`을 가려요.",
      "think": {
        "q": "상품 합계가 15,000원이면 이 쿠폰의 할인은 얼마일까요?",
        "a": "1,500원이에요. 15,000 x 0.1 = 1,500이고 5,000원보다 작아요. 실행 결과에도 1500이 나와요."
      },
      "run": [
        {
          "code": "c = RateDiscount(rate=0.1, max_amount=5000)",
          "out": ""
        },
        {
          "code": "print(c.name)",
          "out": "10% 할인 (최대 5,000원)"
        },
        {
          "code": "print(c.discount_amount(313000))",
          "out": "5000"
        },
        {
          "code": "print(c.discount_amount(15000))",
          "out": "1500"
        },
        {
          "code": "cart.set_coupon(c)",
          "out": ""
        }
      ],
      "state": {
        "nextNumber": 6,
        "products": [
          {
            "number": 1,
            "name": "무선 이어폰",
            "price": 89000,
            "stock": 3,
            "hidden": true,
            "listed": true
          },
          {
            "number": 2,
            "name": "텀블러",
            "price": 15000,
            "stock": 10,
            "hidden": true,
            "listed": true
          },
          {
            "number": 3,
            "name": "보조배터리",
            "price": 32000,
            "stock": 5,
            "hidden": true,
            "listed": true
          },
          {
            "number": 4,
            "name": "마우스패드",
            "price": 9000,
            "stock": 0,
            "hidden": true,
            "listed": true
          },
          {
            "number": 5,
            "name": "USB 허브",
            "price": 18000,
            "stock": 4,
            "hidden": true,
            "listed": true
          }
        ],
        "holder": "cart",
        "lines": [
          {
            "name": "텀블러",
            "number": 2,
            "qty": 9,
            "subtotal": 135000
          },
          {
            "name": "무선 이어폰",
            "number": 1,
            "qty": 2,
            "subtotal": 178000
          }
        ],
        "coupon": "10% 할인 (최대 5,000원)",
        "totals": null
      }
    },
    {
      "short": "3,000원 쿠폰",
      "title": "같은 호출, 다른 계산",
      "concept": "다형성",
      "group": "coupon",
      "say": "`FixedDiscount`도 같은 이름의 메서드를 가져요. 그래서 쿠폰이 어떤 클래스인지 몰라도 `c.discount_amount(합계)` 한 줄로 부를 수 있어요. 같은 호출이 객체에 따라 다르게 동작하는 것이 다형성이에요.",
      "think": {
        "q": "\"20% 할인 (최대 10,000원)\" 쿠폰을 새로 추가하려면 `Cart`를 고쳐야 할까요?",
        "a": "아니요. `RateDiscount(0.2, 10000)` 객체를 하나 만들어 쿠폰 목록에 넣으면 돼요. `Cart`는 `discount_amount`만 부르기 때문이에요."
      },
      "run": [
        {
          "code": "coupons = [Discount(), RateDiscount(0.1, 5000), FixedDiscount(3000, 20000)]",
          "out": ""
        },
        {
          "code": "for c in coupons:\n    print(c.name, '→', c.discount_amount(15000))",
          "out": "쿠폰 없음 → 0\n10% 할인 (최대 5,000원) → 1500\n3,000원 할인 (20,000원 이상 구매 시) → 0"
        }
      ],
      "state": {
        "nextNumber": 6,
        "products": [
          {
            "number": 1,
            "name": "무선 이어폰",
            "price": 89000,
            "stock": 3,
            "hidden": true,
            "listed": true
          },
          {
            "number": 2,
            "name": "텀블러",
            "price": 15000,
            "stock": 10,
            "hidden": true,
            "listed": true
          },
          {
            "number": 3,
            "name": "보조배터리",
            "price": 32000,
            "stock": 5,
            "hidden": true,
            "listed": true
          },
          {
            "number": 4,
            "name": "마우스패드",
            "price": 9000,
            "stock": 0,
            "hidden": true,
            "listed": true
          },
          {
            "number": 5,
            "name": "USB 허브",
            "price": 18000,
            "stock": 4,
            "hidden": true,
            "listed": true
          }
        ],
        "holder": "cart",
        "lines": [
          {
            "name": "텀블러",
            "number": 2,
            "qty": 9,
            "subtotal": 135000
          },
          {
            "name": "무선 이어폰",
            "number": 1,
            "qty": 2,
            "subtotal": 178000
          }
        ],
        "coupon": "10% 할인 (최대 5,000원)",
        "totals": null
      }
    },
    {
      "short": "금액 계산",
      "title": "규칙 3-4를 메서드로",
      "concept": "다형성 활용",
      "group": "cart",
      "say": "① 상품 합계, ② 할인, ③ 배송비, ④ 결제 금액 순서를 메서드로 옮겨요. `discount()`는 쿠폰 종류를 묻지 않고 `discount_amount`를 불러요. 배송비는 (① - ②)가 30,000원 이상이거나 장바구니가 비면 0원이에요.",
      "think": {
        "q": "텀블러 1개(15,000원)에 3,000원 쿠폰을 적용하면 결제 금액은 얼마일까요?",
        "a": "18,000원이에요. 20,000원 미만이라 할인은 0원, 15,000원이 30,000원 미만이라 배송비 3,000원이 붙어요. 실제로 실행해 확인했어요."
      },
      "run": [
        {
          "code": "cart.set_coupon(RateDiscount(rate=0.1, max_amount=5000))",
          "out": ""
        },
        {
          "code": "cart.show()",
          "out": "----------------------------------------\n텀블러\tx 9\t   135,000원\n무선 이어폰\tx 2\t   178,000원\n----------------------------------------\n상품 합계\t\t   313,000원\n할인\t\t\t    -5,000원  [10% 할인 (최대 5,000원)]\n배송비\t\t\t         0원\n결제 금액\t\t   308,000원\n----------------------------------------"
        }
      ],
      "state": {
        "nextNumber": 6,
        "products": [
          {
            "number": 1,
            "name": "무선 이어폰",
            "price": 89000,
            "stock": 3,
            "hidden": true,
            "listed": true
          },
          {
            "number": 2,
            "name": "텀블러",
            "price": 15000,
            "stock": 10,
            "hidden": true,
            "listed": true
          },
          {
            "number": 3,
            "name": "보조배터리",
            "price": 32000,
            "stock": 5,
            "hidden": true,
            "listed": true
          },
          {
            "number": 4,
            "name": "마우스패드",
            "price": 9000,
            "stock": 0,
            "hidden": true,
            "listed": true
          },
          {
            "number": 5,
            "name": "USB 허브",
            "price": 18000,
            "stock": 4,
            "hidden": true,
            "listed": true
          }
        ],
        "holder": "cart",
        "lines": [
          {
            "name": "텀블러",
            "number": 2,
            "qty": 9,
            "subtotal": 135000
          },
          {
            "name": "무선 이어폰",
            "number": 1,
            "qty": 2,
            "subtotal": 178000
          }
        ],
        "coupon": "10% 할인 (최대 5,000원)",
        "totals": {
          "total": 313000,
          "discount": 5000,
          "ship": 0,
          "pay": 308000
        }
      }
    },
    {
      "short": "결제",
      "title": "재고는 결제할 때만 줄어든다",
      "concept": "캡슐화 활용",
      "group": "cart",
      "say": "영수증을 찍고, 줄마다 `decrease_stock(담은 수량)`을 부르고, 장바구니를 비우고, 쿠폰을 \"쿠폰 없음\"으로 되돌려요. 보드에서 텀블러 재고가 10에서 1로, 무선 이어폰이 3에서 1로 바뀌어요.",
      "think": {
        "q": "재고를 `add`가 아니라 `checkout`에서 줄이는 이유는 뭘까요?",
        "a": "발제 규칙이 \"결제하면 재고가 줄어듭니다\"이기 때문이에요. 담았다가 빼는 경우에도 재고를 되돌릴 필요가 없어요."
      },
      "run": [
        {
          "code": "cart.checkout()",
          "out": "[영수증]\n----------------------------------------\n텀블러\tx 9\t   135,000원\n무선 이어폰\tx 2\t   178,000원\n----------------------------------------\n상품 합계\t\t   313,000원\n할인\t\t\t    -5,000원  [10% 할인 (최대 5,000원)]\n배송비\t\t\t         0원\n결제 금액\t\t   308,000원\n----------------------------------------\n결제가 완료되었습니다. 감사합니다!"
        },
        {
          "code": "print(products[1].line_text())",
          "out": "2. 텀블러\t15,000원  (재고 1개)"
        }
      ],
      "state": {
        "nextNumber": 6,
        "products": [
          {
            "number": 1,
            "name": "무선 이어폰",
            "price": 89000,
            "stock": 1,
            "hidden": true,
            "listed": true
          },
          {
            "number": 2,
            "name": "텀블러",
            "price": 15000,
            "stock": 1,
            "hidden": true,
            "listed": true
          },
          {
            "number": 3,
            "name": "보조배터리",
            "price": 32000,
            "stock": 5,
            "hidden": true,
            "listed": true
          },
          {
            "number": 4,
            "name": "마우스패드",
            "price": 9000,
            "stock": 0,
            "hidden": true,
            "listed": true
          },
          {
            "number": 5,
            "name": "USB 허브",
            "price": 18000,
            "stock": 4,
            "hidden": true,
            "listed": true
          }
        ],
        "holder": "cart",
        "lines": [],
        "coupon": "쿠폰 없음",
        "totals": {
          "total": 0,
          "discount": 0,
          "ship": 0,
          "pay": 0
        }
      }
    },
    {
      "short": "메뉴 연결",
      "title": "만든 객체를 메뉴에 연결",
      "concept": "전체 흐름",
      "group": "menu",
      "say": "시작 데이터로 상품 5개, 쿠폰 3개, 장바구니 1개를 만들고, `while` 반복에서 메뉴마다 메서드를 불러요. 메뉴 코드는 계산을 직접 하지 않고 객체에 시키기만 해요. 실행 결과는 발제의 실행 예시대로 입력해 실제로 돌린 것이에요.",
      "think": {
        "q": "입력 검사 함수에서 무한 반복이 생기지 않는 이유는 뭘까요?",
        "a": "`while` 안에서 `input()`을 다시 받기 때문에, 잘못 입력해도 다음 바퀴에 값이 바뀔 기회가 있어요."
      },
      "run": [
        {
          "code": "python shopping_cart.py",
          "out": "--------------------------------------------------\n1.상품목록 2.담기 3.빼기 4.장바구니 5.쿠폰 6.결제 q.종료\n--------------------------------------------------\n선택: 1\n1. 무선 이어폰\t89,000원  (재고 3개)\n2. 텀블러\t15,000원  (재고 10개)\n3. 보조배터리\t32,000원  (재고 5개)\n4. 마우스패드\t9,000원  (품절)\n5. USB 허브\t18,000원  (재고 4개)\n--------------------------------------------------\n1.상품목록 2.담기 3.빼기 4.장바구니 5.쿠폰 6.결제 q.종료\n--------------------------------------------------\n선택: 2\n상품 번호: 4\n품절된 상품입니다.\n--------------------------------------------------\n1.상품목록 2.담기 3.빼기 4.장바구니 5.쿠폰 6.결제 q.종료\n--------------------------------------------------\n선택: 2\n상품 번호: 2\n수량: 9\n텀블러 9개를 담았습니다.\n--------------------------------------------------\n1.상품목록 2.담기 3.빼기 4.장바구니 5.쿠폰 6.결제 q.종료\n--------------------------------------------------\n선택: 2\n상품 번호: 2\n수량: 2\n재고가 부족합니다. (담을 수 있는 수량: 1개)\n--------------------------------------------------\n1.상품목록 2.담기 3.빼기 4.장바구니 5.쿠폰 6.결제 q.종료\n--------------------------------------------------\n선택: 2\n상품 번호: 1\n수량: 2\n무선 이어폰 2개를 담았습니다.\n--------------------------------------------------\n1.상품목록 2.담기 3.빼기 4.장바구니 5.쿠폰 6.결제 q.종료\n--------------------------------------------------\n선택: 5\n1. 쿠폰 없음\n2. 10% 할인 (최대 5,000원)\n3. 3,000원 할인 (20,000원 이상 구매 시)\n쿠폰 번호: 2\n[10% 할인 (최대 5,000원)] 쿠폰을 적용했습니다.\n--------------------------------------------------\n1.상품목록 2.담기 3.빼기 4.장바구니 5.쿠폰 6.결제 q.종료\n--------------------------------------------------\n선택: 4\n----------------------------------------\n텀블러\tx 9\t   135,000원\n무선 이어폰\tx 2\t   178,000원\n----------------------------------------\n상품 합계\t\t   313,000원\n할인\t\t\t    -5,000원  [10% 할인 (최대 5,000원)]\n배송비\t\t\t         0원\n결제 금액\t\t   308,000원\n----------------------------------------\n--------------------------------------------------\n1.상품목록 2.담기 3.빼기 4.장바구니 5.쿠폰 6.결제 q.종료\n--------------------------------------------------\n선택: 6\n[영수증]\n----------------------------------------\n텀블러\tx 9\t   135,000원\n무선 이어폰\tx 2\t   178,000원\n----------------------------------------\n상품 합계\t\t   313,000원\n할인\t\t\t    -5,000원  [10% 할인 (최대 5,000원)]\n배송비\t\t\t         0원\n결제 금액\t\t   308,000원\n----------------------------------------\n결제가 완료되었습니다. 감사합니다!\n--------------------------------------------------\n1.상품목록 2.담기 3.빼기 4.장바구니 5.쿠폰 6.결제 q.종료\n--------------------------------------------------\n선택: 1\n1. 무선 이어폰\t89,000원  (재고 1개)\n2. 텀블러\t15,000원  (재고 1개)\n3. 보조배터리\t32,000원  (재고 5개)\n4. 마우스패드\t9,000원  (품절)\n5. USB 허브\t18,000원  (재고 4개)\n--------------------------------------------------\n1.상품목록 2.담기 3.빼기 4.장바구니 5.쿠폰 6.결제 q.종료\n--------------------------------------------------\n선택: q\n종료합니다."
        }
      ],
      "state": {
        "nextNumber": 6,
        "products": [
          {
            "number": 1,
            "name": "무선 이어폰",
            "price": 89000,
            "stock": 1,
            "hidden": true,
            "listed": true
          },
          {
            "number": 2,
            "name": "텀블러",
            "price": 15000,
            "stock": 1,
            "hidden": true,
            "listed": true
          },
          {
            "number": 3,
            "name": "보조배터리",
            "price": 32000,
            "stock": 5,
            "hidden": true,
            "listed": true
          },
          {
            "number": 4,
            "name": "마우스패드",
            "price": 9000,
            "stock": 0,
            "hidden": true,
            "listed": true
          },
          {
            "number": 5,
            "name": "USB 허브",
            "price": 18000,
            "stock": 4,
            "hidden": true,
            "listed": true
          }
        ],
        "holder": "cart",
        "lines": [],
        "coupon": "쿠폰 없음",
        "totals": {
          "total": 0,
          "discount": 0,
          "ship": 0,
          "pay": 0
        }
      }
    }
  ]
};
