// 12회차 쇼핑몰 장바구니 미니 프로젝트(튜터 답안 기준)를 빈 파일에서 한 단계씩 쌓아 가는 재생기 데이터.
// 파일 4개(product.py, coupon.py, cart.py, main.py)를 이어 붙여 보여 준다. import 줄은 실행할 때만 뺀다.
// blocks는 완성 코드의 조각이고, from 단계에 나타나 until 단계에 사라진다(1부터).
// steps[i].run과 state는 i+1단계까지의 코드를 실제로 파이썬으로 실행해서 뽑은 값이다
// (마지막 단계는 발제의 실행 예시 입력 그대로, 2026-11-11 확인).
import type { BuildReplayData } from "./types";

export const shoppingCart: BuildReplayData = {
  "file": "product.py, coupon.py, cart.py, main.py",
  "board": {
    "counter": "next_id",
    "cart": "Cart 객체, cart.items {상품: 수량}",
    "empty": "items = {} (비어 있음)",
    "ptr": "키",
    "qty": "수량",
    "note": "점선은 장바구니 딕셔너리의 키가 상품 객체 그 자체라는 뜻이에요(복사가 아니에요)."
  },
  "blocks": [
    {
      "from": 1,
      "lines": [
        "# ===== product.py =====",
        "class Product:"
      ]
    },
    {
      "from": 2,
      "lines": [
        "    next_id = 1 # 클래스 변수",
        ""
      ]
    },
    {
      "from": 1,
      "lines": [
        "    # 새 상품의 초기 정보 저장",
        "    def __init__(self, name, price, stock):"
      ]
    },
    {
      "from": 2,
      "lines": [
        "        self.id = Product.next_id",
        "        Product.next_id += 1 # 다음 상품을 위해 Index 값 + 1"
      ]
    },
    {
      "from": 1,
      "lines": [
        "        self.name = name",
        "        self.price = price",
        "        self.stock = stock"
      ]
    },
    {
      "from": 3,
      "lines": [
        "",
        "    def is_sold_out(self):",
        "        return self.stock == 0"
      ]
    },
    {
      "from": 3,
      "lines": [
        "",
        "    def __str__(self):",
        "        stock_text = \"품절\" if self.is_sold_out() else f\"재고 {self.stock}개\"",
        "        return f\"{self.id}: {self.name:<10} {self.price:>8,} {self.stock} ({stock_text})\""
      ]
    },
    {
      "from": 10,
      "lines": [
        "",
        "",
        "# ===== coupon.py =====",
        "class Coupon:",
        "    def __init__(self, name):",
        "        self.name = name",
        "",
        "    # 할인 금액 반환",
        "    def discount_amount(self, total):",
        "        return 0"
      ]
    },
    {
      "from": 11,
      "lines": [
        "",
        "# 10% 할인 쿠폰",
        "class RateDiscount(Coupon):",
        "    # 할인율과 최대 할인 금액 적용",
        "    def __init__(self, rate, max_discount):",
        "        super().__init__(f\"{int(rate * 100)}% 할인 (최대 {max_discount:,}원)\")",
        "        self.rate = rate",
        "        self.max_discount = max_discount",
        "",
        "    def discount_amount(self, total):",
        "        # 상품합계 X 10%, 단 5,000원을 넘지 않는다. 원단위 미만은 버림",
        "        amount = int(total * self.rate)",
        "        return min(amount, self.max_discount)",
        "",
        "# 정액 할인 쿠폰",
        "class FixedDiscount(Coupon):",
        "    def __init__(self, amount, min_total):",
        "        super().__init__(f\"{amount:,}원 할인 ({min_total:,}원 이상 구매 시)\")",
        "        self.amount = amount",
        "        self.min_total = min_total",
        "",
        "    def discount_amount(self, total):",
        "        # 상품 합계가 20,000원 이상이면 3,000원, 아니면 0원",
        "        return self.amount if total >= self.min_total else 0"
      ]
    },
    {
      "from": 4,
      "lines": [
        "",
        "",
        "# ===== cart.py =====",
        "from product import Product"
      ]
    },
    {
      "from": 12,
      "lines": [
        "from coupon import Coupon"
      ]
    },
    {
      "from": 4,
      "lines": [
        "",
        "class Cart:",
        "    def __init__(self):",
        "        # 빈 장바구니 생성",
        "        self.items = {} # {상품: 수량}"
      ]
    },
    {
      "from": 12,
      "lines": [
        "        self.coupon = Coupon(\"쿠폰 없음\") # 처음엔 쿠폰 없음"
      ]
    },
    {
      "from": 5,
      "lines": [
        "",
        "    # 장바구니에 상품 담기",
        "    def add(self, product, qty):"
      ]
    },
    {
      "from": 9,
      "lines": [
        "        # 1개 이상만 담을 수 있다.",
        "        if qty <= 0:",
        "            print(\"1개 이상 담아 주세요.\")",
        "            return",
        ""
      ]
    },
    {
      "from": 5,
      "lines": [
        "        # 품절 상품은 담을 수 없다.",
        "        if product.is_sold_out():",
        "            print(\"품절된 상품입니다.\")",
        "            return",
        "",
        "        # 이미 장바구니에 담겨있는 수량",
        "        in_cart_qty = self.items.get(product, 0)",
        "        # 더 담을 수 있는 수량",
        "        extra_qty = product.stock - in_cart_qty",
        "        if qty > extra_qty: # 재고 수량 범위를 벗어난 경우",
        "            print(f\"재고가 부족합니다. (담을 수 있는 수량: {extra_qty}개)\")",
        "            return",
        "",
        "        self.items[product] = self.items.get(product, 0) + qty",
        "        print(f\"{product.name} {qty}개를 담았습니다.\")"
      ]
    },
    {
      "from": 6,
      "lines": [
        "",
        "    # 장바구니에서 상품 제거(빼기)",
        "    def remove(self,product, qty):",
        "",
        "        if product not in self.items:",
        "            print(\"장바구니에 해당 상품이 없습니다.\")",
        "            return",
        "",
        "        # 담은 수량 이상 빼면 상품을 통째로 삭제",
        "        if qty >= self.items[product]:",
        "            del self.items[product]",
        "            print(f\"{product.name}을 장바구니에서 모두 뺐습니다.\")",
        "        else:",
        "            self.items[product] -= qty",
        "            print(f\"{product.name} {qty}개를 뺐습니다.\")"
      ]
    },
    {
      "from": 4,
      "lines": [
        "",
        "    # 장바구니 비었는지 확인",
        "    def is_empty(self):",
        "        return len(self.items) == 0"
      ]
    },
    {
      "from": 7,
      "lines": [
        "",
        "    # 상품 합계 계산",
        "    def subtotal(self):",
        "        return sum(p.price * q for p, q in self.items.items())"
      ]
    },
    {
      "from": 12,
      "lines": [
        "",
        "    # 쿠폰 적용 (한 번에 1장)",
        "    def apply_coupon(self, coupon):",
        "        self.coupon = coupon",
        "        print(f\"[{coupon.name}] 쿠폰을 적용했습니다.\")",
        "",
        "    # 할인 금액 (쿠폰 종류는 묻지 않는다)",
        "    def discount(self):",
        "        return self.coupon.discount_amount(self.subtotal())"
      ]
    },
    {
      "from": 7,
      "lines": [
        ""
      ]
    },
    {
      "from": 7,
      "lines": [
        "    # 배송비 계산"
      ],
      "until": 12
    },
    {
      "from": 12,
      "lines": [
        "    # 배송비 (할인을 뺀 금액으로 정한다)"
      ]
    },
    {
      "from": 7,
      "lines": [
        "    def shipping(self):",
        "        if self.is_empty(): return 0"
      ]
    },
    {
      "from": 7,
      "lines": [
        "        return 0 if self.subtotal() >= 30_000 else 3_000"
      ],
      "until": 12
    },
    {
      "from": 12,
      "lines": [
        "        return 0 if self.subtotal() - self.discount() >= 30_000 else 3_000"
      ]
    },
    {
      "from": 7,
      "lines": [
        "",
        "    # 결제 금액 계산",
        "    def total(self):"
      ]
    },
    {
      "from": 7,
      "lines": [
        "        return self.subtotal() + self.shipping()"
      ],
      "until": 12
    },
    {
      "from": 12,
      "lines": [
        "        return self.subtotal() - self.discount() + self.shipping()"
      ]
    },
    {
      "from": 8,
      "lines": [
        "",
        "    # 장바구니 내용 출력",
        "    def show(self):",
        "        line = \"-\" * 40",
        "        print(line)",
        "",
        "        if self.is_empty():",
        "            print(\"장바구니가 비어있습니다.\")",
        "",
        "        for p, q in self.items.items():",
        "            # 제품명 가격 x 수량 = 총합계",
        "            print(f\"{p.name:<10} x {q} = {p.price * q:>12,}원\")",
        "",
        "        print(line)",
        "        print(f\"{'상품 합계':<10} {self.subtotal():>15,}원\")"
      ]
    },
    {
      "from": 12,
      "lines": [
        "        print(f\"{'할인':<10} {-self.discount():>15,}원  [{self.coupon.name}]\")"
      ]
    },
    {
      "from": 8,
      "lines": [
        "        print(f\"{'배송비':<10} {self.shipping():>15,}원\")",
        "        print(f\"{'결제 금액':<10} {self.total():>15,}원\")",
        "        print(line)"
      ]
    },
    {
      "from": 13,
      "lines": [
        "",
        "    # 결제",
        "    def checkout(self):",
        "        if self.is_empty():",
        "            print(\"장바구니가 비어있습니다.\")",
        "            return",
        "",
        "        print(\"[영수증]\")",
        "        self.show()",
        "        # 재고 감소 처리",
        "        for p, q in self.items.items():",
        "            p.stock -= q",
        "",
        "        # 장바구니 비우기",
        "        self.items.clear()",
        "        # 쿠폰 초기화",
        "        self.coupon = Coupon(\"쿠폰 없음\")",
        "",
        "        # 결제 성공여부",
        "        print(\"결제가 완료되었습니다. 감사합니다!\")"
      ]
    },
    {
      "from": 14,
      "lines": [
        "",
        "",
        "# ===== main.py =====",
        "from product import Product",
        "from coupon import Coupon, RateDiscount, FixedDiscount",
        "from cart import Cart",
        "",
        "# 판매 상품",
        "products = [",
        "    Product(\"무선이어폰\", 89_000, 3),",
        "    Product(\"텀블러\", 15_000, 10),",
        "    Product(\"보조배터리\", 32_000, 5),",
        "    Product(\"마우스패드\", 9_000, 0),",
        "    Product(\"USB 허브\", 30_000, 10),",
        "]",
        "",
        "# 쿠폰 목록",
        "coupons = [",
        "    Coupon(\"쿠폰 없음\"),",
        "    RateDiscount(rate=0.1, max_discount=5_000),",
        "    FixedDiscount(amount=3_000, min_total=20_000),",
        "]",
        "",
        "# 1 ~ max_number 사이 번호만 받는다",
        "def ask_number(message, max_number):",
        "    while True:",
        "        answer = input(message).strip()",
        "        if answer.isdigit() and 1 <= int(answer) <= max_number:",
        "            return int(answer)",
        "        print(f\"1~{max_number} 사이의 번호를 입력하세요.\")",
        "",
        "# 상품 번호를 받아 상품 객체를 돌려준다",
        "def ask_product():",
        "    number = ask_number(\"상품 번호: \", len(products))",
        "    return products[number - 1]",
        "",
        "def main():",
        "    cart = Cart()",
        "",
        "    while True:",
        "        print(\"-\" * 50)",
        "        print(\"1.상품목록 2.담기 3.빼기 4.장바구니 5.쿠폰 6.결제 q.종료\")",
        "        print(\"-\" * 50)",
        "        choice = input(\"선택: \").strip()",
        "",
        "        if choice == \"1\":",
        "            for p in products: print(p)",
        "        elif choice == \"2\":",
        "            product = ask_product()",
        "            if product.is_sold_out():",
        "                print(\"품절된 상품입니다.\")",
        "                continue",
        "            cart.add(product, ask_number(\"수량: \", 99))",
        "        elif choice == \"3\":",
        "            product = ask_product()",
        "            cart.remove(product, ask_number(\"뺄 수량: \", 99))",
        "        elif choice == \"4\":",
        "            cart.show()",
        "        elif choice == \"5\":",
        "            for number, coupon in enumerate(coupons, start=1):",
        "                print(f\"{number}. {coupon.name}\")",
        "            cart.apply_coupon(coupons[ask_number(\"쿠폰 번호: \", len(coupons)) - 1])",
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
      "say": "가게에 있는 상품 하나의 정보를 담는 틀이에요. 이름, 가격, 재고만 둬요. 장바구니에 담은 수량은 여기 두지 않아요.",
      "think": {
        "q": "담은 수량을 `Product`에 같이 두면 왜 안 될까요?",
        "a": "상품 객체 하나가 상품 목록과 장바구니 양쪽에서 같은 객체로 쓰여요. 속성 하나에 재고와 담은 수량을 섞으면 한쪽을 바꿀 때 다른 쪽도 같이 바뀌어요."
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
            "name": "무선이어폰",
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
            "price": 30000,
            "stock": 10,
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
      "say": "`next_id`는 `def` 밖, 클래스 바로 아래에 있는 클래스 변수예요. 상품을 만들 때마다 지금 번호를 `self.id`에 저장하고 `Product.next_id`를 1 올려요.",
      "think": {
        "q": "두 줄의 순서를 바꿔 올리기를 먼저 하면 첫 상품은 몇 번이 될까요?",
        "a": "2번이에요. 발급기를 먼저 2로 올린 뒤 그 값을 저장하니까요. 저장이 먼저, 올리기가 나중이에요."
      },
      "run": [
        {
          "code": "print([p.id for p in products])",
          "out": "[1, 2, 3, 4, 5]"
        },
        {
          "code": "print(Product.next_id)",
          "out": "6"
        }
      ],
      "state": {
        "nextNumber": 6,
        "products": [
          {
            "number": 1,
            "name": "무선이어폰",
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
            "price": 30000,
            "stock": 10,
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
      "short": "품절과 출력",
      "title": "품절 확인과 목록 한 줄",
      "concept": "메서드, __str__",
      "group": "product",
      "say": "`is_sold_out()`은 재고가 0인지 알려 줘요. `__str__`을 만들어 두면 `print(p)`만으로 목록 한 줄이 나와요. `:<10`은 10칸 왼쪽 정렬, `:>8,`은 8칸 오른쪽 정렬에 천 단위 쉼표예요.",
      "think": {
        "q": "상품목록을 찍을 때마다 f-string을 메뉴 코드에 쓰지 않고 `__str__`에 둔 이유는요?",
        "a": "상품을 어떻게 보여 줄지는 상품이 제일 잘 알아요. 한 곳에 두면 목록, 테스트, 영수증 어디서 찍든 같은 모양이 나와요."
      },
      "run": [
        {
          "code": "for p in products: print(p)",
          "out": "1: 무선이어폰        89,000 3 (재고 3개)\n2: 텀블러          15,000 10 (재고 10개)\n3: 보조배터리        32,000 5 (재고 5개)\n4: 마우스패드         9,000 0 (품절)\n5: USB 허브       30,000 10 (재고 10개)"
        }
      ],
      "state": {
        "nextNumber": 6,
        "products": [
          {
            "number": 1,
            "name": "무선이어폰",
            "price": 89000,
            "stock": 3,
            "hidden": false,
            "listed": true
          },
          {
            "number": 2,
            "name": "텀블러",
            "price": 15000,
            "stock": 10,
            "hidden": false,
            "listed": true
          },
          {
            "number": 3,
            "name": "보조배터리",
            "price": 32000,
            "stock": 5,
            "hidden": false,
            "listed": true
          },
          {
            "number": 4,
            "name": "마우스패드",
            "price": 9000,
            "stock": 0,
            "hidden": false,
            "listed": true
          },
          {
            "number": 5,
            "name": "USB 허브",
            "price": 30000,
            "stock": 10,
            "hidden": false,
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
      "short": "빈 장바구니",
      "title": "장바구니는 딕셔너리 하나",
      "concept": "딕셔너리, 조합",
      "group": "cart",
      "say": "장바구니는 `items` 딕셔너리 하나예요. 키는 상품 객체, 값은 담은 수량이에요. 재고는 상품이, 담은 수량은 장바구니가 따로 가져요.",
      "think": {
        "q": "키로 상품 이름(문자열) 대신 상품 객체를 쓰면 좋은 점은요?",
        "a": "키에서 바로 `p.price`, `p.stock`을 꺼낼 수 있어요. 이름으로 상품 목록을 다시 찾는 코드가 필요 없어요."
      },
      "run": [
        {
          "code": "cart = Cart()",
          "out": ""
        },
        {
          "code": "print(cart.items, cart.is_empty())",
          "out": "{} True"
        }
      ],
      "state": {
        "nextNumber": 6,
        "products": [
          {
            "number": 1,
            "name": "무선이어폰",
            "price": 89000,
            "stock": 3,
            "hidden": false,
            "listed": true
          },
          {
            "number": 2,
            "name": "텀블러",
            "price": 15000,
            "stock": 10,
            "hidden": false,
            "listed": true
          },
          {
            "number": 3,
            "name": "보조배터리",
            "price": 32000,
            "stock": 5,
            "hidden": false,
            "listed": true
          },
          {
            "number": 4,
            "name": "마우스패드",
            "price": 9000,
            "stock": 0,
            "hidden": false,
            "listed": true
          },
          {
            "number": 5,
            "name": "USB 허브",
            "price": 30000,
            "stock": 10,
            "hidden": false,
            "listed": true
          }
        ],
        "holder": "cart",
        "lines": [],
        "coupon": null,
        "totals": null
      }
    },
    {
      "short": "담기",
      "title": "담기: 재고 - 이미 담은 수량",
      "concept": "dict.get, 조건 검사",
      "group": "cart",
      "say": "`self.items.get(product, 0)`은 담긴 적이 없으면 0을 돌려줘요. 더 담을 수 있는 수량은 `product.stock - in_cart_qty`예요. 재고는 담는 동안 줄지 않아요.",
      "think": {
        "q": "텀블러 9개를 담은 뒤 2개를 더 담으면 무엇이 나올까요?",
        "a": "재고 10에서 이미 담은 9를 빼면 1이라 `재고가 부족합니다. (담을 수 있는 수량: 1개)`가 나와요. 발제 예시 그대로예요."
      },
      "run": [
        {
          "code": "cart = Cart()\ntumbler = products[1]",
          "out": ""
        },
        {
          "code": "cart.add(tumbler, 9)",
          "out": "텀블러 9개를 담았습니다."
        },
        {
          "code": "cart.add(tumbler, 2)",
          "out": "재고가 부족합니다. (담을 수 있는 수량: 1개)"
        },
        {
          "code": "cart.add(products[3], 1)",
          "out": "품절된 상품입니다."
        },
        {
          "code": "print(cart.items[tumbler], tumbler.stock)",
          "out": "9 10"
        }
      ],
      "state": {
        "nextNumber": 6,
        "products": [
          {
            "number": 1,
            "name": "무선이어폰",
            "price": 89000,
            "stock": 3,
            "hidden": false,
            "listed": true
          },
          {
            "number": 2,
            "name": "텀블러",
            "price": 15000,
            "stock": 10,
            "hidden": false,
            "listed": true
          },
          {
            "number": 3,
            "name": "보조배터리",
            "price": 32000,
            "stock": 5,
            "hidden": false,
            "listed": true
          },
          {
            "number": 4,
            "name": "마우스패드",
            "price": 9000,
            "stock": 0,
            "hidden": false,
            "listed": true
          },
          {
            "number": 5,
            "name": "USB 허브",
            "price": 30000,
            "stock": 10,
            "hidden": false,
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
      "short": "빼기",
      "title": "빼기: 일부만 또는 통째로",
      "concept": "del, in",
      "group": "cart",
      "say": "장바구니에 없는 상품이면 먼저 돌려보내요. 담은 수량 이상을 빼면 `del`로 키를 지우고, 아니면 수량만 줄여요.",
      "think": {
        "q": "2개 담긴 상품에서 5개를 빼라고 하면 어떻게 될까요?",
        "a": "`qty >= self.items[product]`가 참이라 키가 통째로 지워지고 `모두 뺐습니다`가 나와요. 수량이 음수로 남지 않아요."
      },
      "run": [
        {
          "code": "cart = Cart()\ncart.add(products[1], 9)",
          "out": "텀블러 9개를 담았습니다."
        },
        {
          "code": "cart.add(products[0], 3)",
          "out": "무선이어폰 3개를 담았습니다."
        },
        {
          "code": "cart.remove(products[0], 1)",
          "out": "무선이어폰 1개를 뺐습니다."
        },
        {
          "code": "cart.remove(products[2], 1)",
          "out": "장바구니에 해당 상품이 없습니다."
        }
      ],
      "state": {
        "nextNumber": 6,
        "products": [
          {
            "number": 1,
            "name": "무선이어폰",
            "price": 89000,
            "stock": 3,
            "hidden": false,
            "listed": true
          },
          {
            "number": 2,
            "name": "텀블러",
            "price": 15000,
            "stock": 10,
            "hidden": false,
            "listed": true
          },
          {
            "number": 3,
            "name": "보조배터리",
            "price": 32000,
            "stock": 5,
            "hidden": false,
            "listed": true
          },
          {
            "number": 4,
            "name": "마우스패드",
            "price": 9000,
            "stock": 0,
            "hidden": false,
            "listed": true
          },
          {
            "number": 5,
            "name": "USB 허브",
            "price": 30000,
            "stock": 10,
            "hidden": false,
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
            "name": "무선이어폰",
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
      "short": "합계",
      "title": "상품 합계, 배송비, 결제 금액",
      "concept": "제너레이터 식, sum",
      "group": "cart",
      "say": "`sum(p.price * q for p, q in self.items.items())`는 키와 값을 함께 꺼내 가격 x 수량을 모두 더해요. 합계를 변수에 저장하지 않고 부를 때마다 계산해서, 담거나 뺄 때 따로 고칠 필요가 없어요.",
      "think": {
        "q": "텀블러 1개(15,000원)만 담으면 결제 금액은요?",
        "a": "30,000원 미만이라 배송비 3,000원이 붙어 18,000원이에요."
      },
      "run": [
        {
          "code": "cart = Cart()\ncart.add(products[1], 9)\ncart.add(products[0], 2)",
          "out": "텀블러 9개를 담았습니다.\n무선이어폰 2개를 담았습니다."
        },
        {
          "code": "print(cart.subtotal(), cart.shipping(), cart.total())",
          "out": "313000 0 313000"
        }
      ],
      "state": {
        "nextNumber": 6,
        "products": [
          {
            "number": 1,
            "name": "무선이어폰",
            "price": 89000,
            "stock": 3,
            "hidden": false,
            "listed": true
          },
          {
            "number": 2,
            "name": "텀블러",
            "price": 15000,
            "stock": 10,
            "hidden": false,
            "listed": true
          },
          {
            "number": 3,
            "name": "보조배터리",
            "price": 32000,
            "stock": 5,
            "hidden": false,
            "listed": true
          },
          {
            "number": 4,
            "name": "마우스패드",
            "price": 9000,
            "stock": 0,
            "hidden": false,
            "listed": true
          },
          {
            "number": 5,
            "name": "USB 허브",
            "price": 30000,
            "stock": 10,
            "hidden": false,
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
            "name": "무선이어폰",
            "number": 1,
            "qty": 2,
            "subtotal": 178000
          }
        ],
        "coupon": null,
        "totals": {
          "total": 313000,
          "discount": 0,
          "ship": 0,
          "pay": 313000
        }
      }
    },
    {
      "short": "장바구니 출력",
      "title": "장바구니 보여 주기",
      "concept": "f-string 정렬",
      "group": "cart",
      "say": "`show()`는 줄마다 이름, 수량, 금액을 찍고 아래에 합계를 모아 찍어요. 한글은 한 글자가 화면에서 두 칸이라 `:<10`으로 맞춰도 줄이 조금 어긋나요.",
      "think": {
        "q": "장바구니가 비었을 때 `show()`는 무엇을 찍을까요?",
        "a": "`장바구니가 비어있습니다.`를 찍고, 합계와 배송비, 결제 금액은 모두 0원이에요. `shipping()`이 빈 장바구니면 0을 돌려주니까요."
      },
      "run": [
        {
          "code": "cart = Cart()\ncart.add(products[1], 9)\ncart.add(products[0], 2)",
          "out": "텀블러 9개를 담았습니다.\n무선이어폰 2개를 담았습니다."
        },
        {
          "code": "cart.show()",
          "out": "----------------------------------------\n텀블러        x 9 =      135,000원\n무선이어폰      x 2 =      178,000원\n----------------------------------------\n상품 합계              313,000원\n배송비                      0원\n결제 금액              313,000원\n----------------------------------------"
        }
      ],
      "state": {
        "nextNumber": 6,
        "products": [
          {
            "number": 1,
            "name": "무선이어폰",
            "price": 89000,
            "stock": 3,
            "hidden": false,
            "listed": true
          },
          {
            "number": 2,
            "name": "텀블러",
            "price": 15000,
            "stock": 10,
            "hidden": false,
            "listed": true
          },
          {
            "number": 3,
            "name": "보조배터리",
            "price": 32000,
            "stock": 5,
            "hidden": false,
            "listed": true
          },
          {
            "number": 4,
            "name": "마우스패드",
            "price": 9000,
            "stock": 0,
            "hidden": false,
            "listed": true
          },
          {
            "number": 5,
            "name": "USB 허브",
            "price": 30000,
            "stock": 10,
            "hidden": false,
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
            "name": "무선이어폰",
            "number": 1,
            "qty": 2,
            "subtotal": 178000
          }
        ],
        "coupon": null,
        "totals": {
          "total": 313000,
          "discount": 0,
          "ship": 0,
          "pay": 313000
        }
      }
    },
    {
      "short": "수량 검사",
      "title": "0개와 음수 막기",
      "concept": "입력 검사",
      "group": "cart",
      "say": "튜터 답안 그대로면 `cart.add(텀블러, -5)`가 `텀블러 -5개를 담았습니다.`로 통과해요. 맨 앞에 `qty <= 0` 검사를 하나 넣어 막아요.",
      "think": {
        "q": "0개를 담으면 무엇이 문제였을까요?",
        "a": "`{텀블러: 0}`이 생겨요. 상품은 없는데 `is_empty()`는 키가 하나 있으니 False가 되고, 배송비 3,000원이 붙어요."
      },
      "run": [
        {
          "code": "cart = Cart()",
          "out": ""
        },
        {
          "code": "cart.add(products[1], -5)",
          "out": "1개 이상 담아 주세요."
        },
        {
          "code": "cart.add(products[1], 0)",
          "out": "1개 이상 담아 주세요."
        },
        {
          "code": "print(cart.is_empty())",
          "out": "True"
        }
      ],
      "state": {
        "nextNumber": 6,
        "products": [
          {
            "number": 1,
            "name": "무선이어폰",
            "price": 89000,
            "stock": 3,
            "hidden": false,
            "listed": true
          },
          {
            "number": 2,
            "name": "텀블러",
            "price": 15000,
            "stock": 10,
            "hidden": false,
            "listed": true
          },
          {
            "number": 3,
            "name": "보조배터리",
            "price": 32000,
            "stock": 5,
            "hidden": false,
            "listed": true
          },
          {
            "number": 4,
            "name": "마우스패드",
            "price": 9000,
            "stock": 0,
            "hidden": false,
            "listed": true
          },
          {
            "number": 5,
            "name": "USB 허브",
            "price": 30000,
            "stock": 10,
            "hidden": false,
            "listed": true
          }
        ],
        "holder": "cart",
        "lines": [],
        "coupon": null,
        "totals": {
          "total": 0,
          "discount": 0,
          "ship": 0,
          "pay": 0
        }
      }
    },
    {
      "short": "쿠폰의 틀",
      "title": "부모 쿠폰 Coupon",
      "concept": "상속(부모 클래스)",
      "group": "coupon",
      "say": "모든 쿠폰은 이름(`name`)과 `discount_amount(total)`을 가진다는 공통 틀이에요. 부모 `Coupon`은 할인이 없어서 항상 0원을 돌려줘요. 그래서 `Coupon(\"쿠폰 없음\")`이 곧 \"쿠폰 없음\"이에요.",
      "think": {
        "q": "\"쿠폰 없음\"을 `None` 대신 객체로 두면 좋은 점은요?",
        "a": "장바구니가 할인 금액을 구할 때 \"쿠폰이 있나?\"를 `if`로 매번 검사하지 않아도 돼요. 언제나 `discount_amount()`를 부르면 돼요."
      },
      "run": [
        {
          "code": "c = Coupon(\"쿠폰 없음\")",
          "out": ""
        },
        {
          "code": "print(c.name, c.discount_amount(313_000))",
          "out": "쿠폰 없음 0"
        }
      ],
      "state": {
        "nextNumber": 6,
        "products": [
          {
            "number": 1,
            "name": "무선이어폰",
            "price": 89000,
            "stock": 3,
            "hidden": false,
            "listed": true
          },
          {
            "number": 2,
            "name": "텀블러",
            "price": 15000,
            "stock": 10,
            "hidden": false,
            "listed": true
          },
          {
            "number": 3,
            "name": "보조배터리",
            "price": 32000,
            "stock": 5,
            "hidden": false,
            "listed": true
          },
          {
            "number": 4,
            "name": "마우스패드",
            "price": 9000,
            "stock": 0,
            "hidden": false,
            "listed": true
          },
          {
            "number": 5,
            "name": "USB 허브",
            "price": 30000,
            "stock": 10,
            "hidden": false,
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
      "short": "쿠폰 둘",
      "title": "자식 쿠폰 두 종류",
      "concept": "상속, 오버라이딩, 다형성",
      "group": "coupon",
      "say": "`RateDiscount`와 `FixedDiscount`는 `Coupon`을 물려받아요. 이름은 `super().__init__(이름)`으로 부모에게 맡기고, `discount_amount`만 다시 정의해요(오버라이딩). 부르는 코드는 같은데 객체마다 다르게 계산해요(다형성).",
      "think": {
        "q": "313,000원의 10%는 31,300원인데 왜 5,000이 나올까요?",
        "a": "`min(amount, self.max_discount)`가 최대 5,000원을 넘지 않게 잘라요."
      },
      "run": [
        {
          "code": "coupons = [Coupon(\"쿠폰 없음\"), RateDiscount(0.1, 5_000), FixedDiscount(3_000, 20_000)]",
          "out": ""
        },
        {
          "code": "for c in coupons:\n    print(c.name, c.discount_amount(15_000), c.discount_amount(313_000))",
          "out": "쿠폰 없음 0 0\n10% 할인 (최대 5,000원) 1500 5000\n3,000원 할인 (20,000원 이상 구매 시) 0 3000"
        }
      ],
      "state": {
        "nextNumber": 6,
        "products": [
          {
            "number": 1,
            "name": "무선이어폰",
            "price": 89000,
            "stock": 3,
            "hidden": false,
            "listed": true
          },
          {
            "number": 2,
            "name": "텀블러",
            "price": 15000,
            "stock": 10,
            "hidden": false,
            "listed": true
          },
          {
            "number": 3,
            "name": "보조배터리",
            "price": 32000,
            "stock": 5,
            "hidden": false,
            "listed": true
          },
          {
            "number": 4,
            "name": "마우스패드",
            "price": 9000,
            "stock": 0,
            "hidden": false,
            "listed": true
          },
          {
            "number": 5,
            "name": "USB 허브",
            "price": 30000,
            "stock": 10,
            "hidden": false,
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
      "short": "쿠폰 적용",
      "title": "장바구니에 쿠폰 넣기",
      "concept": "조합, 다형성 활용",
      "group": "cart",
      "say": "장바구니가 `self.coupon`을 하나 들고, `discount()`는 쿠폰 종류를 묻지 않고 `discount_amount()`만 불러요. 배송비는 할인을 뺀 금액으로 정하도록 바꿔요.",
      "think": {
        "q": "상품 합계 32,000원에 3,000원 쿠폰이면 배송비는요?",
        "a": "할인 뒤 29,000원이라 30,000원 미만이에요. 배송비 3,000원이 붙어요."
      },
      "run": [
        {
          "code": "cart = Cart()\ncart.add(products[1], 9)\ncart.add(products[0], 2)",
          "out": "텀블러 9개를 담았습니다.\n무선이어폰 2개를 담았습니다."
        },
        {
          "code": "cart.apply_coupon(RateDiscount(rate=0.1, max_discount=5_000))",
          "out": "[10% 할인 (최대 5,000원)] 쿠폰을 적용했습니다."
        },
        {
          "code": "cart.show()",
          "out": "----------------------------------------\n텀블러        x 9 =      135,000원\n무선이어폰      x 2 =      178,000원\n----------------------------------------\n상품 합계              313,000원\n할인                  -5,000원  [10% 할인 (최대 5,000원)]\n배송비                      0원\n결제 금액              308,000원\n----------------------------------------"
        }
      ],
      "state": {
        "nextNumber": 6,
        "products": [
          {
            "number": 1,
            "name": "무선이어폰",
            "price": 89000,
            "stock": 3,
            "hidden": false,
            "listed": true
          },
          {
            "number": 2,
            "name": "텀블러",
            "price": 15000,
            "stock": 10,
            "hidden": false,
            "listed": true
          },
          {
            "number": 3,
            "name": "보조배터리",
            "price": 32000,
            "stock": 5,
            "hidden": false,
            "listed": true
          },
          {
            "number": 4,
            "name": "마우스패드",
            "price": 9000,
            "stock": 0,
            "hidden": false,
            "listed": true
          },
          {
            "number": 5,
            "name": "USB 허브",
            "price": 30000,
            "stock": 10,
            "hidden": false,
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
            "name": "무선이어폰",
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
      "title": "결제할 때만 재고 줄이기",
      "concept": "책임 나누기",
      "group": "cart",
      "say": "`checkout()`은 영수증을 찍고, 담은 수량만큼 `p.stock -= q`로 재고를 줄이고, 장바구니를 비우고, 쿠폰을 되돌려요. 담을 때는 재고를 건드리지 않았으니, 재고가 줄어드는 곳은 여기 한 곳뿐이에요.",
      "think": {
        "q": "`checkout()`에서 `self.items = {}` 대신 `clear()`를 쓴 차이는요?",
        "a": "여기서는 결과가 같아요. 둘 다 장바구니를 비워요. `clear()`는 지금 딕셔너리를 비우고, `= {}`는 새 딕셔너리로 바꿔 끼워요."
      },
      "run": [
        {
          "code": "cart = Cart()\ncart.add(products[1], 9)\ncart.add(products[0], 2)\ncart.apply_coupon(RateDiscount(rate=0.1, max_discount=5_000))",
          "out": "텀블러 9개를 담았습니다.\n무선이어폰 2개를 담았습니다.\n[10% 할인 (최대 5,000원)] 쿠폰을 적용했습니다."
        },
        {
          "code": "cart.checkout()",
          "out": "[영수증]\n----------------------------------------\n텀블러        x 9 =      135,000원\n무선이어폰      x 2 =      178,000원\n----------------------------------------\n상품 합계              313,000원\n할인                  -5,000원  [10% 할인 (최대 5,000원)]\n배송비                      0원\n결제 금액              308,000원\n----------------------------------------\n결제가 완료되었습니다. 감사합니다!"
        },
        {
          "code": "print(products[1].stock, products[0].stock, cart.is_empty(), cart.coupon.name)",
          "out": "1 1 True 쿠폰 없음"
        }
      ],
      "state": {
        "nextNumber": 6,
        "products": [
          {
            "number": 1,
            "name": "무선이어폰",
            "price": 89000,
            "stock": 1,
            "hidden": false,
            "listed": true
          },
          {
            "number": 2,
            "name": "텀블러",
            "price": 15000,
            "stock": 1,
            "hidden": false,
            "listed": true
          },
          {
            "number": 3,
            "name": "보조배터리",
            "price": 32000,
            "stock": 5,
            "hidden": false,
            "listed": true
          },
          {
            "number": 4,
            "name": "마우스패드",
            "price": 9000,
            "stock": 0,
            "hidden": false,
            "listed": true
          },
          {
            "number": 5,
            "name": "USB 허브",
            "price": 30000,
            "stock": 10,
            "hidden": false,
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
      "short": "메뉴",
      "title": "main.py에서 메뉴 연결",
      "concept": "전체 흐름",
      "group": "menu",
      "say": "`main.py`는 상품과 쿠폰 목록을 만들고, 메뉴에서 고른 번호대로 장바구니 메서드를 부르기만 해요. 번호 입력은 `ask_number()`가 `while True` 안에서 다시 받아요.",
      "think": {
        "q": "결제 뒤 상품목록에서 무선이어폰과 텀블러 재고는 몇 개일까요?",
        "a": "무선이어폰 3 - 2 = 1개, 텀블러 10 - 9 = 1개예요. 담을 때가 아니라 결제할 때 줄었어요."
      },
      "run": [
        {
          "code": "uv run main.py",
          "out": "--------------------------------------------------\n1.상품목록 2.담기 3.빼기 4.장바구니 5.쿠폰 6.결제 q.종료\n--------------------------------------------------\n선택: 1\n1: 무선이어폰        89,000 3 (재고 3개)\n2: 텀블러          15,000 10 (재고 10개)\n3: 보조배터리        32,000 5 (재고 5개)\n4: 마우스패드         9,000 0 (품절)\n5: USB 허브       30,000 10 (재고 10개)\n--------------------------------------------------\n1.상품목록 2.담기 3.빼기 4.장바구니 5.쿠폰 6.결제 q.종료\n--------------------------------------------------\n선택: 2\n상품 번호: 4\n품절된 상품입니다.\n--------------------------------------------------\n1.상품목록 2.담기 3.빼기 4.장바구니 5.쿠폰 6.결제 q.종료\n--------------------------------------------------\n선택: 2\n상품 번호: 2\n수량: 9\n텀블러 9개를 담았습니다.\n--------------------------------------------------\n1.상품목록 2.담기 3.빼기 4.장바구니 5.쿠폰 6.결제 q.종료\n--------------------------------------------------\n선택: 2\n상품 번호: 2\n수량: 2\n재고가 부족합니다. (담을 수 있는 수량: 1개)\n--------------------------------------------------\n1.상품목록 2.담기 3.빼기 4.장바구니 5.쿠폰 6.결제 q.종료\n--------------------------------------------------\n선택: 2\n상품 번호: 1\n수량: 2\n무선이어폰 2개를 담았습니다.\n--------------------------------------------------\n1.상품목록 2.담기 3.빼기 4.장바구니 5.쿠폰 6.결제 q.종료\n--------------------------------------------------\n선택: 5\n1. 쿠폰 없음\n2. 10% 할인 (최대 5,000원)\n3. 3,000원 할인 (20,000원 이상 구매 시)\n쿠폰 번호: 2\n[10% 할인 (최대 5,000원)] 쿠폰을 적용했습니다.\n--------------------------------------------------\n1.상품목록 2.담기 3.빼기 4.장바구니 5.쿠폰 6.결제 q.종료\n--------------------------------------------------\n선택: 4\n----------------------------------------\n텀블러        x 9 =      135,000원\n무선이어폰      x 2 =      178,000원\n----------------------------------------\n상품 합계              313,000원\n할인                  -5,000원  [10% 할인 (최대 5,000원)]\n배송비                      0원\n결제 금액              308,000원\n----------------------------------------\n--------------------------------------------------\n1.상품목록 2.담기 3.빼기 4.장바구니 5.쿠폰 6.결제 q.종료\n--------------------------------------------------\n선택: 6\n[영수증]\n----------------------------------------\n텀블러        x 9 =      135,000원\n무선이어폰      x 2 =      178,000원\n----------------------------------------\n상품 합계              313,000원\n할인                  -5,000원  [10% 할인 (최대 5,000원)]\n배송비                      0원\n결제 금액              308,000원\n----------------------------------------\n결제가 완료되었습니다. 감사합니다!\n--------------------------------------------------\n1.상품목록 2.담기 3.빼기 4.장바구니 5.쿠폰 6.결제 q.종료\n--------------------------------------------------\n선택: 1\n1: 무선이어폰        89,000 1 (재고 1개)\n2: 텀블러          15,000 1 (재고 1개)\n3: 보조배터리        32,000 5 (재고 5개)\n4: 마우스패드         9,000 0 (품절)\n5: USB 허브       30,000 10 (재고 10개)\n--------------------------------------------------\n1.상품목록 2.담기 3.빼기 4.장바구니 5.쿠폰 6.결제 q.종료\n--------------------------------------------------\n선택: q\n종료합니다."
        }
      ],
      "state": {
        "nextNumber": 6,
        "products": [
          {
            "number": 1,
            "name": "무선이어폰",
            "price": 89000,
            "stock": 1,
            "hidden": false,
            "listed": true
          },
          {
            "number": 2,
            "name": "텀블러",
            "price": 15000,
            "stock": 1,
            "hidden": false,
            "listed": true
          },
          {
            "number": 3,
            "name": "보조배터리",
            "price": 32000,
            "stock": 5,
            "hidden": false,
            "listed": true
          },
          {
            "number": 4,
            "name": "마우스패드",
            "price": 9000,
            "stock": 0,
            "hidden": false,
            "listed": true
          },
          {
            "number": 5,
            "name": "USB 허브",
            "price": 30000,
            "stock": 10,
            "hidden": false,
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
