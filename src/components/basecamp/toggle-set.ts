// 낙관적 토글용 불변 Set 헬퍼 — React 상태로 안전하게 다루기 위해 매번 새 Set을
// 만든다. 베이스캠프 STEP 체크리스트와 보강 레슨 체크리스트가 같은 토글 규칙을
// 공유한다(둘 다 toggleBasecampItem을 낙관적으로 부른다).

export function withToggled(
  set: ReadonlySet<string>,
  id: string,
  present: boolean,
): ReadonlySet<string> {
  return present ? withAdded(set, id) : withRemoved(set, id);
}

export function withAdded(set: ReadonlySet<string>, id: string): ReadonlySet<string> {
  if (set.has(id)) return set;
  const next = new Set(set);
  next.add(id);
  return next;
}

export function withRemoved(set: ReadonlySet<string>, id: string): ReadonlySet<string> {
  if (!set.has(id)) return set;
  const next = new Set(set);
  next.delete(id);
  return next;
}
