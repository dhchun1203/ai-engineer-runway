#!/usr/bin/env node
// 폰트 서브셋 생성 준비 스크립트 — 빌드 파이프라인 밖에서 수동 1회 실행한다.
//
// 역할 분담: 이 스크립트는 게이트가 아니다. 산출물(public/fonts/PretendardVariable.subset.woff2)
// 을 저장소에 커밋하고, 그 정합성(콘텐츠 문자 집합이 서브셋 cmap에 전부 있는지)은
// `scripts/check-font-glyph-coverage.mjs`가 `npm run build` 등 평소 흐름에서 상시로 검사한다.
// 즉 이 스크립트를 다시 실행하는 시점은 (a) 레슨 콘텐츠가 크게 늘었거나 (b) 커버리지 게이트가
// 새 문자 누락을 보고했을 때뿐이다.
//
// 실행: node scripts/subset-font.mjs
//
// 문자 집합 구성(D8-J):
//   실측 문자(콘텐츠 소스 직접 스캔) ∪ KS X 1001 완성형 한글 2,350자 ∪ ASCII 출력 가능 문자
//   ∪ 프로젝트 상용 기호
//
// KS X 1001 완성형 2,350자는 손으로 옮기지 않고 Unicode.org 공식 매핑 테이블에서 그대로
// 가져왔다: https://www.unicode.org/Public/MAPPINGS/OBSOLETE/EASTASIA/KSC/KSX1001.TXT
// ("HANGUL SYLLABLE" 주석이 달린 행만 필터링 → 정확히 2,350행, U+AC00~U+D79D 범위 — 이 파일
// 자체가 "The number of characters enumerated ... is 8824, as listed in KS X 1001"이라고
// 명시하는 표준 기구(Unicode Consortium) 배포 1차 자료다). 이 세션에서 해당 URL을 직접 fetch해
// 파싱하고 행 수가 2,350과 정확히 일치함을 확인했다 — 기억에 의존한 재현이 아니라 1차 자료
// 검증이므로, 이 스크립트를 다시 실행할 필요 없이 아래 문자열 상수를 그대로 신뢰할 수 있다.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import subsetFont from 'subset-font';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const SOURCE_FONT_PATH = path.join(ROOT, 'assets', 'fonts', 'PretendardVariable.woff2');
const OUTPUT_FONT_PATH = path.join(ROOT, 'public', 'fonts', 'PretendardVariable.subset.woff2');

// KS X 1001 완성형 한글 2,350자 (출처: 위 헤더 주석 참고, Unicode.org KSX1001.TXT에서
// "HANGUL SYLLABLE" 행만 추출 — 정확히 2,350자, U+AC00~U+D79D).
const KS_X_1001_HANGUL_2350 =
  "가각간갇갈갉갊감갑값갓갔강갖갗같갚갛개객" +
  "갠갤갬갭갯갰갱갸갹갼걀걋걍걔걘걜거걱건걷" +
  "걸걺검겁것겄겅겆겉겊겋게겐겔겜겝겟겠겡겨" +
  "격겪견겯결겸겹겻겼경곁계곈곌곕곗고곡곤곧" +
  "골곪곬곯곰곱곳공곶과곽관괄괆괌괍괏광괘괜" +
  "괠괩괬괭괴괵괸괼굄굅굇굉교굔굘굡굣구국군" +
  "굳굴굵굶굻굼굽굿궁궂궈궉권궐궜궝궤궷귀귁" +
  "귄귈귐귑귓규균귤그극근귿글긁금급긋긍긔기" +
  "긱긴긷길긺김깁깃깅깆깊까깍깎깐깔깖깜깝깟" +
  "깠깡깥깨깩깬깰깸깹깻깼깽꺄꺅꺌꺼꺽꺾껀껄" +
  "껌껍껏껐껑께껙껜껨껫껭껴껸껼꼇꼈꼍꼐꼬꼭" +
  "꼰꼲꼴꼼꼽꼿꽁꽂꽃꽈꽉꽐꽜꽝꽤꽥꽹꾀꾄꾈" +
  "꾐꾑꾕꾜꾸꾹꾼꿀꿇꿈꿉꿋꿍꿎꿔꿜꿨꿩꿰꿱" +
  "꿴꿸뀀뀁뀄뀌뀐뀔뀜뀝뀨끄끅끈끊끌끎끓끔끕" +
  "끗끙끝끼끽낀낄낌낍낏낑나낙낚난낟날낡낢남" +
  "납낫났낭낮낯낱낳내낵낸낼냄냅냇냈냉냐냑냔" +
  "냘냠냥너넉넋넌널넒넓넘넙넛넜넝넣네넥넨넬" +
  "넴넵넷넸넹녀녁년녈념녑녔녕녘녜녠노녹논놀" +
  "놂놈놉놋농높놓놔놘놜놨뇌뇐뇔뇜뇝뇟뇨뇩뇬" +
  "뇰뇹뇻뇽누눅눈눋눌눔눕눗눙눠눴눼뉘뉜뉠뉨" +
  "뉩뉴뉵뉼늄늅늉느늑는늘늙늚늠늡늣능늦늪늬" +
  "늰늴니닉닌닐닒님닙닛닝닢다닥닦단닫달닭닮" +
  "닯닳담답닷닸당닺닻닿대댁댄댈댐댑댓댔댕댜" +
  "더덕덖던덛덜덞덟덤덥덧덩덫덮데덱덴델뎀뎁" +
  "뎃뎄뎅뎌뎐뎔뎠뎡뎨뎬도독돈돋돌돎돐돔돕돗" +
  "동돛돝돠돤돨돼됐되된될됨됩됫됴두둑둔둘둠" +
  "둡둣둥둬뒀뒈뒝뒤뒨뒬뒵뒷뒹듀듄듈듐듕드득" +
  "든듣들듦듬듭듯등듸디딕딘딛딜딤딥딧딨딩딪" +
  "따딱딴딸땀땁땃땄땅땋때땍땐땔땜땝땟땠땡떠" +
  "떡떤떨떪떫떰떱떳떴떵떻떼떽뗀뗄뗌뗍뗏뗐뗑" +
  "뗘뗬또똑똔똘똥똬똴뙈뙤뙨뚜뚝뚠뚤뚫뚬뚱뛔" +
  "뛰뛴뛸뜀뜁뜅뜨뜩뜬뜯뜰뜸뜹뜻띄띈띌띔띕띠" +
  "띤띨띰띱띳띵라락란랄람랍랏랐랑랒랖랗래랙" +
  "랜랠램랩랫랬랭랴략랸럇량러럭런럴럼럽럿렀" +
  "렁렇레렉렌렐렘렙렛렝려력련렬렴렵렷렸령례" +
  "롄롑롓로록론롤롬롭롯롱롸롼뢍뢨뢰뢴뢸룀룁" +
  "룃룅료룐룔룝룟룡루룩룬룰룸룹룻룽뤄뤘뤠뤼" +
  "뤽륀륄륌륏륑류륙륜률륨륩륫륭르륵른를름릅" +
  "릇릉릊릍릎리릭린릴림립릿링마막만많맏말맑" +
  "맒맘맙맛망맞맡맣매맥맨맬맴맵맷맸맹맺먀먁" +
  "먈먕머먹먼멀멂멈멉멋멍멎멓메멕멘멜멤멥멧" +
  "멨멩며멱면멸몃몄명몇몌모목몫몬몰몲몸몹못" +
  "몽뫄뫈뫘뫙뫼묀묄묍묏묑묘묜묠묩묫무묵묶문" +
  "묻물묽묾뭄뭅뭇뭉뭍뭏뭐뭔뭘뭡뭣뭬뮈뮌뮐뮤" +
  "뮨뮬뮴뮷므믄믈믐믓미믹민믿밀밂밈밉밋밌밍" +
  "및밑바박밖밗반받발밝밞밟밤밥밧방밭배백밴" +
  "밸뱀뱁뱃뱄뱅뱉뱌뱍뱐뱝버벅번벋벌벎범법벗" +
  "벙벚베벡벤벧벨벰벱벳벴벵벼벽변별볍볏볐병" +
  "볕볘볜보복볶본볼봄봅봇봉봐봔봤봬뵀뵈뵉뵌" +
  "뵐뵘뵙뵤뵨부북분붇불붉붊붐붑붓붕붙붚붜붤" +
  "붰붸뷔뷕뷘뷜뷩뷰뷴뷸븀븃븅브븍븐블븜븝븟" +
  "비빅빈빌빎빔빕빗빙빚빛빠빡빤빨빪빰빱빳빴" +
  "빵빻빼빽뺀뺄뺌뺍뺏뺐뺑뺘뺙뺨뻐뻑뻔뻗뻘뻠" +
  "뻣뻤뻥뻬뼁뼈뼉뼘뼙뼛뼜뼝뽀뽁뽄뽈뽐뽑뽕뾔" +
  "뾰뿅뿌뿍뿐뿔뿜뿟뿡쀼쁑쁘쁜쁠쁨쁩삐삑삔삘" +
  "삠삡삣삥사삭삯산삳살삵삶삼삽삿샀상샅새색" +
  "샌샐샘샙샛샜생샤샥샨샬샴샵샷샹섀섄섈섐섕" +
  "서석섞섟선섣설섦섧섬섭섯섰성섶세섹센셀셈" +
  "셉셋셌셍셔셕션셜셤셥셧셨셩셰셴셸솅소속솎" +
  "손솔솖솜솝솟송솥솨솩솬솰솽쇄쇈쇌쇔쇗쇘쇠" +
  "쇤쇨쇰쇱쇳쇼쇽숀숄숌숍숏숑수숙순숟술숨숩" +
  "숫숭숯숱숲숴쉈쉐쉑쉔쉘쉠쉥쉬쉭쉰쉴쉼쉽쉿" +
  "슁슈슉슐슘슛슝스슥슨슬슭슴습슷승시식신싣" +
  "실싫심십싯싱싶싸싹싻싼쌀쌈쌉쌌쌍쌓쌔쌕쌘" +
  "쌜쌤쌥쌨쌩썅써썩썬썰썲썸썹썼썽쎄쎈쎌쏀쏘" +
  "쏙쏜쏟쏠쏢쏨쏩쏭쏴쏵쏸쐈쐐쐤쐬쐰쐴쐼쐽쑈" +
  "쑤쑥쑨쑬쑴쑵쑹쒀쒔쒜쒸쒼쓩쓰쓱쓴쓸쓺쓿씀" +
  "씁씌씐씔씜씨씩씬씰씸씹씻씽아악안앉않알앍" +
  "앎앓암압앗았앙앝앞애액앤앨앰앱앳앴앵야약" +
  "얀얄얇얌얍얏양얕얗얘얜얠얩어억언얹얻얼얽" +
  "얾엄업없엇었엉엊엌엎에엑엔엘엠엡엣엥여역" +
  "엮연열엶엷염엽엾엿였영옅옆옇예옌옐옘옙옛" +
  "옜오옥온올옭옮옰옳옴옵옷옹옻와왁완왈왐왑" +
  "왓왔왕왜왝왠왬왯왱외왹왼욀욈욉욋욍요욕욘" +
  "욜욤욥욧용우욱운울욹욺움웁웃웅워웍원월웜" +
  "웝웠웡웨웩웬웰웸웹웽위윅윈윌윔윕윗윙유육" +
  "윤율윰윱윳융윷으윽은을읊음읍읏응읒읓읔읕" +
  "읖읗의읜읠읨읫이익인일읽읾잃임입잇있잉잊" +
  "잎자작잔잖잗잘잚잠잡잣잤장잦재잭잰잴잼잽" +
  "잿쟀쟁쟈쟉쟌쟎쟐쟘쟝쟤쟨쟬저적전절젊점접" +
  "젓정젖제젝젠젤젬젭젯젱져젼졀졈졉졌졍졔조" +
  "족존졸졺좀좁좃종좆좇좋좌좍좔좝좟좡좨좼좽" +
  "죄죈죌죔죕죗죙죠죡죤죵주죽준줄줅줆줌줍줏" +
  "중줘줬줴쥐쥑쥔쥘쥠쥡쥣쥬쥰쥴쥼즈즉즌즐즘" +
  "즙즛증지직진짇질짊짐집짓징짖짙짚짜짝짠짢" +
  "짤짧짬짭짯짰짱째짹짼쨀쨈쨉쨋쨌쨍쨔쨘쨩쩌" +
  "쩍쩐쩔쩜쩝쩟쩠쩡쩨쩽쪄쪘쪼쪽쫀쫄쫌쫍쫏쫑" +
  "쫓쫘쫙쫠쫬쫴쬈쬐쬔쬘쬠쬡쭁쭈쭉쭌쭐쭘쭙쭝" +
  "쭤쭸쭹쮜쮸쯔쯤쯧쯩찌찍찐찔찜찝찡찢찧차착" +
  "찬찮찰참찹찻찼창찾채책챈챌챔챕챗챘챙챠챤" +
  "챦챨챰챵처척천철첨첩첫첬청체첵첸첼쳄쳅쳇" +
  "쳉쳐쳔쳤쳬쳰촁초촉촌촐촘촙촛총촤촨촬촹최" +
  "쵠쵤쵬쵭쵯쵱쵸춈추축춘출춤춥춧충춰췄췌췐" +
  "취췬췰췸췹췻췽츄츈츌츔츙츠측츤츨츰츱츳층" +
  "치칙친칟칠칡침칩칫칭카칵칸칼캄캅캇캉캐캑" +
  "캔캘캠캡캣캤캥캬캭컁커컥컨컫컬컴컵컷컸컹" +
  "케켁켄켈켐켑켓켕켜켠켤켬켭켯켰켱켸코콕콘" +
  "콜콤콥콧콩콰콱콴콸쾀쾅쾌쾡쾨쾰쿄쿠쿡쿤쿨" +
  "쿰쿱쿳쿵쿼퀀퀄퀑퀘퀭퀴퀵퀸퀼큄큅큇큉큐큔" +
  "큘큠크큭큰클큼큽킁키킥킨킬킴킵킷킹타탁탄" +
  "탈탉탐탑탓탔탕태택탠탤탬탭탯탰탱탸턍터턱" +
  "턴털턺텀텁텃텄텅테텍텐텔템텝텟텡텨텬텼톄" +
  "톈토톡톤톨톰톱톳통톺톼퇀퇘퇴퇸툇툉툐투툭" +
  "툰툴툼툽툿퉁퉈퉜퉤튀튁튄튈튐튑튕튜튠튤튬" +
  "튱트특튼튿틀틂틈틉틋틔틘틜틤틥티틱틴틸팀" +
  "팁팃팅파팍팎판팔팖팜팝팟팠팡팥패팩팬팰팸" +
  "팹팻팼팽퍄퍅퍼퍽펀펄펌펍펏펐펑페펙펜펠펨" +
  "펩펫펭펴편펼폄폅폈평폐폘폡폣포폭폰폴폼폽" +
  "폿퐁퐈퐝푀푄표푠푤푭푯푸푹푼푿풀풂품풉풋" +
  "풍풔풩퓌퓐퓔퓜퓟퓨퓬퓰퓸퓻퓽프픈플픔픕픗" +
  "피픽핀필핌핍핏핑하학한할핥함합핫항해핵핸" +
  "핼햄햅햇했행햐향허헉헌헐헒험헙헛헝헤헥헨" +
  "헬헴헵헷헹혀혁현혈혐협혓혔형혜혠혤혭호혹" +
  "혼홀홅홈홉홋홍홑화확환활홧황홰홱홴횃횅회" +
  "획횐횔횝횟횡효횬횰횹횻후훅훈훌훑훔훗훙훠" +
  "훤훨훰훵훼훽휀휄휑휘휙휜휠휨휩휫휭휴휵휸" +
  "휼흄흇흉흐흑흔흖흗흘흙흠흡흣흥흩희흰흴흼" +
  "흽힁히힉힌힐힘힙힛힝";

// --- 1. 콘텐츠 문자 집합 수집 (앱 코드를 import하지 않고 소스 파일을 직접 스캔) ---
// `scripts/check-font-glyph-coverage.mjs`의 스캔 대상·제외 규칙과 정확히 동일한 로직을
// 이 스크립트에도 독립적으로 둔다 — e2e-mobile-overflow.mjs가 .velite/lessons.json을
// 독립 재파싱하는 것과 같은 원칙(같은 함수를 공유하면 계산이 틀려도 검증이 같이 틀린다).

const EXCLUDED_CODEPOINT_RANGES = [
  [0x0000, 0x001f], // 제어문자
  [0xfeff, 0xfeff], // BOM / ZERO WIDTH NO-BREAK SPACE
  [0x200d, 0x200d], // ZERO WIDTH JOINER (이모지 시퀀스 연결자)
  [0xfe0f, 0xfe0f], // VARIATION SELECTOR-16 (이모지 표현 선택자)
  [0xe000, 0xf8ff], // Private Use Area (BMP)
  [0x20d0, 0x20ff], // Combining Diacritical Marks for Symbols (예: U+20E3 키캡 결합 기호)
  [0x2300, 0x23ff], // Miscellaneous Technical (⏰⏱⏪ 등 이모지로 쓰이는 구간)
  [0x2600, 0x27bf], // Misc Symbols / Dingbats (이모지로 자주 쓰이는 구간)
  [0x1f000, 0x1ffff], // 이모지 대다수(Emoticons/Misc Symbols and Pictographs/Transport 등)
  [0xf0000, 0xffffd], // Supplementary Private Use Area-A
  [0x100000, 0x10fffd], // Supplementary Private Use Area-B
];

function isExcludedCodepoint(cp) {
  return EXCLUDED_CODEPOINT_RANGES.some(([start, end]) => cp >= start && cp <= end);
}

function walkFiles(absDir, extFilter) {
  const results = [];
  if (!fs.existsSync(absDir)) return results;
  const stack = [absDir];
  while (stack.length > 0) {
    const current = stack.pop();
    const stat = fs.statSync(current);
    if (stat.isDirectory()) {
      for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
        stack.push(path.join(current, entry.name));
      }
    } else if (stat.isFile()) {
      if (!extFilter || extFilter.test(current)) {
        results.push(current);
      }
    }
  }
  return results;
}

function listTopLevelFiles(absDir, extFilter) {
  if (!fs.existsSync(absDir)) return [];
  return fs
    .readdirSync(absDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && extFilter.test(entry.name))
    .map((entry) => path.join(absDir, entry.name));
}

const contentFiles = [
  ...walkFiles(path.join(ROOT, 'src', 'content', 'lessons'), /\.mdx$/),
  path.join(ROOT, 'src', 'content', 'modules.ts'),
  ...walkFiles(path.join(ROOT, 'src'), /\.tsx$/),
  ...listTopLevelFiles(path.join(ROOT, 'docs'), /\.md$/),
].filter((p) => fs.existsSync(p));

const measuredCodepoints = new Set();
for (const filePath of contentFiles) {
  const text = fs.readFileSync(filePath, 'utf8');
  for (const ch of text) {
    const cp = ch.codePointAt(0);
    if (isExcludedCodepoint(cp)) continue;
    measuredCodepoints.add(cp);
  }
}

console.log(
  `subset-font: 콘텐츠 소스 ${contentFiles.length}개 파일에서 실측 문자 ${measuredCodepoints.size}개 수집`,
);

// --- 2. KS X 1001 완성형 한글 2,350자 (D8-J) ---
// 이 세션에서 [...KS_X_1001_HANGUL_2350].length === 2350과 new Set(코드포인트).size === 2350을
// 둘 다 확인했다 — 위 헤더 주석의 출처(Unicode.org KSX1001.TXT)와 코드포인트 단위로 완전히
// 일치함을 별도 스크립트로 diff해 교차 검증했다(0 missing, 0 extra).
const ksx1001Codepoints = new Set([...KS_X_1001_HANGUL_2350].map((ch) => ch.codePointAt(0)));
console.log(`subset-font: KS X 1001 완성형 한글 ${ksx1001Codepoints.size}개 포함`);

// --- 3. ASCII 출력 가능 문자 (U+0020~U+007E) ---
const asciiPrintableCodepoints = new Set();
for (let cp = 0x0020; cp <= 0x007e; cp++) {
  asciiPrintableCodepoints.add(cp);
}

// --- 4. 프로젝트 상용 기호 (D8-J) — 각 문자에 이름을 주석으로 단다 ---
const PROJECT_SYMBOLS = [
  0x00b7, // · 가운뎃점(MIDDLE DOT) — 복합어·구분자 표기
  0x2014, // — 엠대시(EM DASH)
  0x2013, // – 엔대시(EN DASH) — 범위 표기(예: "1~2주")에 병용
  0x2018, // ' 왼쪽 홑따옴표(LEFT SINGLE QUOTATION MARK)
  0x2019, // ' 오른쪽 홑따옴표(RIGHT SINGLE QUOTATION MARK)
  0x201c, // " 왼쪽 겹따옴표(LEFT DOUBLE QUOTATION MARK)
  0x201d, // " 오른쪽 겹따옴표(RIGHT DOUBLE QUOTATION MARK)
  0x2026, // … 말줄임표(HORIZONTAL ELLIPSIS)
  0x2190, // ← 왼쪽 화살표(LEFTWARDS ARROW)
  0x2191, // ↑ 위쪽 화살표(UPWARDS ARROW)
  0x2192, // → 오른쪽 화살표(RIGHTWARDS ARROW)
  0x2193, // ↓ 아래쪽 화살표(DOWNWARDS ARROW)
  0x2713, // ✓ 체크(CHECK MARK)
  0x2714, // ✔ 굵은 체크(HEAVY CHECK MARK)
  0x25cf, // ● 채워진 원(BLACK CIRCLE) — 불릿
  0x25cb, // ○ 빈 원(WHITE CIRCLE) — 불릿(미완료 표시 등)
  0x2261, // ≡ 항등(IDENTICAL TO) — 참고용, 실사용 시 대비
];
const projectSymbolCodepoints = new Set(PROJECT_SYMBOLS);

// --- 5. 합집합 ---
const finalCodepoints = new Set([
  ...measuredCodepoints,
  ...ksx1001Codepoints,
  ...asciiPrintableCodepoints,
  ...projectSymbolCodepoints,
]);

const subsetText = [...finalCodepoints].map((cp) => String.fromCodePoint(cp)).join('');

console.log(`subset-font: 최종 서브셋 문자 집합 ${finalCodepoints.size}개`);

// --- 6. 원본 폰트 읽기 + 서브셋 생성 ---
// variationAxes 옵션을 지정하지 않는다 — subset-font 문서(README "Reducing the variation space")에
// 따르면 명시하지 않은 축은 그대로 유지된다. 이 프로젝트는 weight 축(45~920)을 통째로 보존해야
// 하므로(축이 잘리면 font-weight: 700을 쓰는 제목·강조가 굵어지지 않는다) variationAxes를 아예
// 생략해 전체 가변 축을 그대로 넘긴다.
async function main() {
  if (!fs.existsSync(SOURCE_FONT_PATH)) {
    console.error(`subset-font: 원본 폰트가 없습니다: ${path.relative(ROOT, SOURCE_FONT_PATH)}`);
    process.exit(1);
  }

  const originalBuffer = fs.readFileSync(SOURCE_FONT_PATH);
  const originalSize = originalBuffer.length;

  const subsetBuffer = await subsetFont(originalBuffer, subsetText, {
    targetFormat: 'woff2',
  });

  fs.mkdirSync(path.dirname(OUTPUT_FONT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_FONT_PATH, subsetBuffer);

  const subsetSize = subsetBuffer.length;
  const reductionPercent = ((1 - subsetSize / originalSize) * 100).toFixed(2);

  console.log('\n=== subset-font: 결과 ===');
  console.log(`원본 크기: ${originalSize.toLocaleString()} bytes`);
  console.log(`서브셋 크기: ${subsetSize.toLocaleString()} bytes`);
  console.log(`감소율: ${reductionPercent}%`);
  console.log(`포함 문자 수: ${finalCodepoints.size.toLocaleString()}`);
  console.log(`출력 경로: ${path.relative(ROOT, OUTPUT_FONT_PATH)}`);
  console.log('=== 끝 ===\n');
}

main().catch((e) => {
  console.error(`subset-font: 실패 — ${e instanceof Error ? e.message : String(e)}`);
  process.exit(1);
});
