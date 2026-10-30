/* Exercise library for the 3D figure. Each exercise is a loop of key poses:
   joint angles in degrees (Euler XYZ, figure faces +z, its left is +x).
   Signs: hip/shoulder flexion and elbow flexion are negative X, knee flexion is
   positive X, ankle plantar flexion is positive X, spine forward bend is
   positive X, left abduction is positive Z (right: negative Z). */

export type Joint = 'root' | 'spine' | 'head' | 'lShoulder' | 'lElbow' | 'rShoulder' | 'rElbow' | 'lHip' | 'lKnee' | 'lAnkle' | 'rHip' | 'rKnee' | 'rAnkle';
/** Points used to pin the figure to the floor. */
export type Anchor = Joint | 'lToe' | 'rToe' | 'lHeel' | 'rHeel' | 'lHand' | 'rHand';
export type Segment = 'torso' | 'pelvis' | 'lThigh' | 'rThigh' | 'lShin' | 'rShin' | 'lFoot' | 'rFoot' | 'lUpperArm' | 'rUpperArm' | 'lForearm' | 'rForearm';
export type Pose = Partial<Record<Joint, [number, number, number]>>;

export interface Key {
  pose: Pose;
  /** Seconds to move here from the previous key. */
  move: number;
  /** Seconds to stay in this pose. */
  hold?: number;
}

export type Prop =
  | { kind: 'chair'; z: number }
  | { kind: 'box'; x: number; z: number; w: number; d: number; h: number }
  | { kind: 'wall'; z: number }
  | { kind: 'mat' }
  | { kind: 'band'; from: Anchor; to: [number, number, number] };

export type Group = 'knee' | 'hip' | 'calf' | 'shoulder' | 'strength';

export interface Exercise {
  id: string;
  group: Group;
  ru: { title: string; dose: string; cues: string[] };
  kk: { title: string; dose: string; cues: string[] };
  keys: Key[];
  /** Points kept fixed on the floor (their average is pinned in x/z). */
  anchors: Anchor[];
  /** Height of the pinned point, or 'min' to rest the lowest part of the body on the floor. */
  ground: number | 'min';
  props?: Prop[];
  focus: Segment[];
  /** Camera position for the default view and the point it looks at. */
  camera?: { pos: [number, number, number]; target: [number, number, number] };
  /** Free in the trial. */
  free?: boolean;
}

const ARMS_DOWN: Pose = { lShoulder: [0, 0, 8], rShoulder: [0, 0, -8] };
const SOLE = 0.09; // ankle joint height when the foot is flat

const LYING_CAM = { pos: [2.5, 1.2, 0.3] as [number, number, number], target: [0, 0.3, -0.5] as [number, number, number] };
const CALF_CAM = { pos: [2.5, 1.0, 2.3] as [number, number, number], target: [0, 0.65, 0] as [number, number, number] };

export const EXERCISES: Exercise[] = [
  // ---------- Knee ----------
  {
    id: 'chair-squat', group: 'knee', free: true,
    ru: { title: 'Присед к стулу', dose: '3 × 10–12', cues: ['Колени смотрят туда же, куда носки', 'Таз назад, как будто садитесь на стул', 'Коснулись стула — встаём, не плюхаясь'] },
    kk: { title: 'Орындыққа отыру', dose: '3 × 10–12', cues: ['Тізе аяқтың ұшымен бір бағытта', 'Жамбасты артқа, орындыққа отырғандай', 'Орындыққа тиіп — тұрамыз'] },
    keys: [
      { pose: { ...ARMS_DOWN }, move: 1.2, hold: 0.6 },
      { pose: { spine: [35, 0, 0], lHip: [-90, 0, 4], rHip: [-90, 0, -4], lKnee: [105, 0, 0], rKnee: [105, 0, 0], lAnkle: [-15, 0, 0], rAnkle: [-15, 0, 0], lShoulder: [-80, 0, 6], rShoulder: [-80, 0, -6] }, move: 2, hold: 0.5 },
    ],
    anchors: ['lAnkle', 'rAnkle'], ground: SOLE, props: [{ kind: 'chair', z: -0.36 }],
    focus: ['lThigh', 'rThigh', 'pelvis'],
  },
  {
    id: 'split-squat', group: 'knee',
    ru: { title: 'Сплит-присед', dose: '3 × 8–10 на каждую ногу', cues: ['Корпус прямо, вес на передней ноге', 'Заднее колено опускается почти до пола', 'Переднее колено над стопой, не внутрь'] },
    kk: { title: 'Сплит-отыру', dose: 'Әр аяққа 3 × 8–10', cues: ['Дене тік, салмақ алдыңғы аяқта', 'Артқы тізе еденге дейін түседі', 'Алдыңғы тізе табан үстінде'] },
    keys: [
      { pose: { lHip: [-40, 0, 4], lKnee: [31, 0, 0], lAnkle: [9, 0, 0], rHip: [10, 0, -4], rKnee: [64, 0, 0], rAnkle: [-4, 0, 0], ...ARMS_DOWN }, move: 1.3, hold: 0.5 },
      { pose: { lHip: [-80, 0, 4], lKnee: [90, 0, 0], lAnkle: [-10, 0, 0], rHip: [10, 0, -4], rKnee: [100, 0, 0], rAnkle: [-20, 0, 0], ...ARMS_DOWN }, move: 1.8, hold: 0.4 },
    ],
    anchors: ['lAnkle'], ground: SOLE,
    focus: ['lThigh', 'pelvis'],
  },
  {
    id: 'step-down', group: 'knee',
    ru: { title: 'Шаг вниз с платформы', dose: '3 × 10 на ногу, медленно', cues: ['Опорное колено не уходит внутрь', 'Пяткой свободной ноги только касаемся пола', 'Высота платформы 10–20 см'] },
    kk: { title: 'Платформадан төмен қадам', dose: 'Әр аяққа 3 × 10, баяу', cues: ['Тірек тізе ішке кетпейді', 'Бос аяқтың өкшесімен еденге тек тиеміз', 'Платформа биіктігі 10–20 см'] },
    keys: [
      { pose: { rHip: [-28, 0, -3], rKnee: [18, 0, 0], rAnkle: [-10, 0, 0], ...ARMS_DOWN, lShoulder: [0, 0, 18], rShoulder: [0, 0, -18] }, move: 1.3, hold: 0.4 },
      { pose: { spine: [18, 0, 0], lHip: [-62, 0, 3], lKnee: [90, 0, 0], lAnkle: [-28, 0, 0], rHip: [-36, 0, -3], rKnee: [14, 0, 0], rAnkle: [-12, 0, 0], lShoulder: [-30, 0, 18], rShoulder: [-30, 0, -18] }, move: 2.4, hold: 0.3 },
    ],
    anchors: ['lAnkle'], ground: 0.2 + SOLE, props: [{ kind: 'box', x: 0, z: -0.07, w: 0.42, d: 0.42, h: 0.2 }],
    focus: ['lThigh', 'pelvis'],
  },
  {
    id: 'wall-sit', group: 'knee',
    ru: { title: 'Изометрия у стены («стульчик»)', dose: '3–5 × 30–45 с', cues: ['Спина прижата к стене', 'Колени над стопами, угол около 90°', 'Если приседания пока болезненны — начните с этого'] },
    kk: { title: 'Қабырға жанындағы изометрия («орындық»)', dose: '3–5 × 30–45 с', cues: ['Арқа қабырғаға тығыз', 'Тізе табан үстінде, бұрышы 90°-қа жуық', 'Отыру әзірге ауырса — осыдан бастаңыз'] },
    keys: [
      { pose: { lHip: [-72, 0, 4], rHip: [-72, 0, -4], lKnee: [72, 0, 0], rKnee: [72, 0, 0], ...ARMS_DOWN }, move: 1.2, hold: 0.4 },
      { pose: { lHip: [-90, 0, 4], rHip: [-90, 0, -4], lKnee: [90, 0, 0], rKnee: [90, 0, 0], ...ARMS_DOWN }, move: 1.4, hold: 4 },
    ],
    anchors: ['lAnkle', 'rAnkle'], ground: SOLE, props: [{ kind: 'wall', z: -0.58 }],
    focus: ['lThigh', 'rThigh'],
  },

  // ---------- Hip and core ----------
  {
    id: 'glute-bridge', group: 'hip', free: true,
    ru: { title: 'Ягодичный мост', dose: '3 × 12', cues: ['Пятки ближе к тазу, стопы на ширине таза', 'Поднимайте таз ягодицами, а не поясницей', 'Наверху — прямая линия от плеч до колен'] },
    kk: { title: 'Бөксе көпірі', dose: '3 × 12', cues: ['Өкше жамбасқа жақын', 'Жамбасты бөксе бұлшықетімен көтеріңіз', 'Жоғарыда иық пен тізе бір сызықта'] },
    keys: [
      { pose: { root: [-90, 0, 0], lHip: [-45, 0, 6], rHip: [-45, 0, -6], lKnee: [95, 0, 0], rKnee: [95, 0, 0], lAnkle: [40, 0, 0], rAnkle: [40, 0, 0], lShoulder: [0, 0, 18], rShoulder: [0, 0, -18] }, move: 1.3, hold: 0.5 },
      { pose: { root: [-115, 0, 0], lHip: [0, 0, 6], rHip: [0, 0, -6], lKnee: [95, 0, 0], rKnee: [95, 0, 0], lAnkle: [20, 0, 0], rAnkle: [20, 0, 0], lShoulder: [-25, 0, 18], rShoulder: [-25, 0, -18] }, move: 1.3, hold: 1 },
    ],
    anchors: ['lAnkle', 'rAnkle'], ground: 'min', props: [{ kind: 'mat' }],
    focus: ['pelvis', 'lThigh', 'rThigh'], camera: LYING_CAM,
  },
  {
    id: 'sl-glute-bridge', group: 'hip',
    ru: { title: 'Ягодичный мост на одной ноге', dose: '3 × 8–10 на ногу', cues: ['Таз не заваливается в сторону', 'Свободная нога продолжает линию бедра', 'Переходите сюда, когда 3 × 12 на двух ногах даются легко'] },
    kk: { title: 'Бір аяқпен бөксе көпірі', dose: 'Әр аяққа 3 × 8–10', cues: ['Жамбас бір жаққа құламайды', 'Бос аяқ сан сызығын жалғастырады', 'Екі аяқпен 3 × 12 оңай болғанда көшіңіз'] },
    keys: [
      { pose: { root: [-90, 0, 0], lHip: [-45, 0, 4], lKnee: [95, 0, 0], lAnkle: [40, 0, 0], rHip: [-45, 0, -4], rKnee: [0, 0, 0], lShoulder: [0, 0, 18], rShoulder: [0, 0, -18] }, move: 1.3, hold: 0.5 },
      { pose: { root: [-115, 0, 0], lHip: [0, 0, 4], lKnee: [95, 0, 0], lAnkle: [20, 0, 0], rHip: [0, 0, -4], rKnee: [0, 0, 0], lShoulder: [-25, 0, 18], rShoulder: [-25, 0, -18] }, move: 1.4, hold: 1 },
    ],
    anchors: ['lAnkle'], ground: 'min', props: [{ kind: 'mat' }],
    focus: ['pelvis', 'lThigh'], camera: LYING_CAM,
  },
  {
    id: 'side-lying-abduction', group: 'hip',
    ru: { title: 'Отведение бедра лёжа на боку', dose: '3 × 12–15', cues: ['Тело в одну линию, таз не откатывается назад', 'Носок верхней ноги смотрит вперёд, не вверх', 'Поднимайте на 30–40°, медленно опускайте'] },
    kk: { title: 'Бүйірде жатып санды бұру', dose: '3 × 12–15', cues: ['Дене бір сызықта', 'Жоғарғы аяқтың ұшы алға қарайды', '30–40°-қа көтеріп, баяу түсіріңіз'] },
    keys: [
      { pose: { root: [0, 0, 90], lHip: [0, 0, 2], rHip: [-10, 0, 0], rKnee: [25, 0, 0], rShoulder: [-170, 0, 0], rElbow: [-60, 0, 0], lShoulder: [-20, 0, 10] }, move: 1, hold: 0.4 },
      { pose: { root: [0, 0, 90], lHip: [0, 0, 36], rHip: [-10, 0, 0], rKnee: [25, 0, 0], rShoulder: [-170, 0, 0], rElbow: [-60, 0, 0], lShoulder: [-20, 0, 10] }, move: 1.2, hold: 0.6 },
    ],
    anchors: ['root'], ground: 'min', props: [{ kind: 'mat' }],
    focus: ['pelvis', 'lThigh'], camera: { pos: [0.4, 1.3, 2.8], target: [0, 0.25, 0] },
  },
  {
    id: 'side-plank', group: 'hip',
    ru: { title: 'Боковая планка', dose: '3 × 20–40 с', cues: ['Локоть под плечом', 'Тело в одну линию от головы до стоп', 'Новичкам — с опорой на колени'] },
    kk: { title: 'Бүйір планка', dose: '3 × 20–40 с', cues: ['Шынтақ иықтың астында', 'Дене бастан табанға дейін бір сызықта', 'Жаңадан бастағандар — тізеге сүйеніп'] },
    keys: [
      { pose: { root: [0, 0, 80], rShoulder: [0, 0, -82], rElbow: [-90, 0, 0], lShoulder: [0, 0, 20] }, move: 1, hold: 0.3 },
      { pose: { root: [0, 0, 68], rShoulder: [0, 0, -70], rElbow: [-90, 0, 0], lShoulder: [0, 0, 160] }, move: 1.4, hold: 3.5 },
    ],
    anchors: ['rElbow'], ground: 'min', props: [{ kind: 'mat' }],
    focus: ['torso', 'pelvis'], camera: { pos: [0.6, 1.2, 3], target: [0, 0.35, 0] },
  },
  {
    id: 'sl-rdl', group: 'hip',
    ru: { title: 'Румынская тяга на одной ноге', dose: '3 × 8 на ногу', cues: ['Спина прямая, наклон идёт из тазобедренного сустава', 'Опорное колено слегка согнуто', 'Свободная нога уходит назад в линию с корпусом'] },
    kk: { title: 'Бір аяқпен румын тартылысы', dose: 'Әр аяққа 3 × 8', cues: ['Арқа түзу, иілу жамбас буынынан', 'Тірек тізе сәл бүгілген', 'Бос аяқ денемен бір сызықта артқа кетеді'] },
    keys: [
      { pose: { lKnee: [6, 0, 0], rHip: [5, 0, -3], rKnee: [30, 0, 0], ...ARMS_DOWN }, move: 1.4, hold: 0.5 },
      { pose: { root: [72, 0, 0], lHip: [-82, 0, 3], lKnee: [18, 0, 0], lAnkle: [-8, 0, 0], rHip: [-2, 0, -3], rKnee: [0, 0, 0], lShoulder: [-72, 0, 6], rShoulder: [-72, 0, -6] }, move: 2, hold: 0.5 },
    ],
    anchors: ['lAnkle'], ground: SOLE,
    focus: ['pelvis', 'lThigh'], camera: { pos: [3.2, 1.35, 1.5], target: [0, 0.75, 0] },
  },

  // ---------- Calf and foot ----------
  {
    id: 'calf-raise', group: 'calf', free: true,
    ru: { title: 'Подъёмы на носки на прямых ногах', dose: '3 × 15, затем на одной ноге', cues: ['Работает икроножная мышца', 'Вверх за 1 с, вниз за 3 с', 'Вес на большом пальце, пятки не разваливаются'] },
    kk: { title: 'Түзу аяқпен ұшына көтерілу', dose: '3 × 15, кейін бір аяқпен', cues: ['Балтырдың үлкен бұлшықеті жұмыс істейді', 'Жоғары 1 с, төмен 3 с', 'Салмақ бас бармақта'] },
    keys: [
      { pose: { ...ARMS_DOWN }, move: 2.4, hold: 0.3 },
      { pose: { lAnkle: [34, 0, 0], rAnkle: [34, 0, 0], ...ARMS_DOWN }, move: 0.9, hold: 0.6 },
    ],
    anchors: ['lToe', 'rToe'], ground: 0.04,
    focus: ['lShin', 'rShin'], camera: CALF_CAM,
  },
  {
    id: 'bent-knee-calf-raise', group: 'calf',
    ru: { title: 'Подъёмы на носки с согнутыми коленями', dose: '3 × 15, затем на одной ноге', cues: ['Работает камбаловидная мышца — главный «амортизатор» бегуна', 'Колени согнуты и не разгибаются во время подъёма'] },
    kk: { title: 'Бүгілген тізеде ұшына көтерілу', dose: '3 × 15, кейін бір аяқпен', cues: ['Камбала тәрізді бұлшықет жұмыс істейді', 'Тізе бүгілген күйде қалады'] },
    keys: [
      { pose: { lHip: [-30, 0, 4], rHip: [-30, 0, -4], lKnee: [50, 0, 0], rKnee: [50, 0, 0], lAnkle: [-20, 0, 0], rAnkle: [-20, 0, 0], spine: [10, 0, 0], ...ARMS_DOWN }, move: 2.4, hold: 0.3 },
      { pose: { lHip: [-30, 0, 4], rHip: [-30, 0, -4], lKnee: [50, 0, 0], rKnee: [50, 0, 0], lAnkle: [18, 0, 0], rAnkle: [18, 0, 0], spine: [10, 0, 0], ...ARMS_DOWN }, move: 0.9, hold: 0.6 },
    ],
    anchors: ['lToe', 'rToe'], ground: 0.04,
    focus: ['lShin', 'rShin'], camera: CALF_CAM,
  },
  {
    id: 'heel-drop', group: 'calf',
    ru: { title: 'Медленные опускания с края ступеньки', dose: '3 × 10, 3 секунды вниз', cues: ['Передняя часть стопы на ступеньке', 'Опускайте пятки ниже края медленно', 'Боль в ахилле — не выше 5 из 10 и проходит к утру'] },
    kk: { title: 'Баспалдақ шетінен баяу түсу', dose: '3 × 10, 3 секунд төмен', cues: ['Табанның алдыңғы бөлігі баспалдақта', 'Өкшені шеттен төмен баяу түсіріңіз', 'Ахиллдегі ауырсыну 5/10-нан аспайды'] },
    keys: [
      { pose: { lAnkle: [30, 0, 0], rAnkle: [30, 0, 0], ...ARMS_DOWN }, move: 1, hold: 0.4 },
      { pose: { lAnkle: [-22, 0, 0], rAnkle: [-22, 0, 0], ...ARMS_DOWN }, move: 3, hold: 0.3 },
    ],
    anchors: ['lToe', 'rToe'], ground: 0.18 + 0.04, props: [{ kind: 'box', x: 0, z: -0.05, w: 0.6, d: 0.3, h: 0.18 }],
    focus: ['lShin', 'rShin', 'lFoot', 'rFoot'], camera: { pos: [2.6, 1.15, 2.4], target: [0, 0.8, 0] },
  },

  // ---------- Shoulder ----------
  {
    id: 'band-external-rotation', group: 'shoulder',
    ru: { title: 'Наружная ротация с резиной', dose: '3 × 12–15', cues: ['Локоть прижат к телу и согнут под 90°', 'Разворачивайте предплечье наружу, плечо не поднимается', 'Медленный возврат'] },
    kk: { title: 'Резеңкемен сыртқа бұру', dose: '3 × 12–15', cues: ['Шынтақ денеге тығыз, 90°-қа бүгілген', 'Білекті сыртқа бұрыңыз, иық көтерілмейді', 'Баяу қайтару'] },
    keys: [
      { pose: { lShoulder: [0, -10, 4], lElbow: [-90, 0, 0], rShoulder: [0, 10, -4], rElbow: [-90, 0, 0] }, move: 1.6, hold: 0.3 },
      { pose: { lShoulder: [0, 70, 4], lElbow: [-90, 0, 0], rShoulder: [0, 10, -4], rElbow: [-90, 0, 0] }, move: 1.2, hold: 0.5 },
    ],
    anchors: ['lAnkle', 'rAnkle'], ground: SOLE, props: [{ kind: 'band', from: 'lHand', to: [-0.6, 1.0, 0.45] }],
    focus: ['lUpperArm', 'lForearm'], camera: { pos: [0.6, 1.6, 2.4], target: [0, 1.1, 0] },
  },
  {
    id: 'prone-y-t', group: 'shoulder',
    ru: { title: '«Y» и «T» лёжа на животе', dose: '3 × 10', cues: ['Сводите лопатки, потом поднимайте руки', 'Шея длинная, взгляд в пол', 'Большие пальцы смотрят вверх'] },
    kk: { title: 'Ішпен жатып «Y» және «T»', dose: '3 × 10', cues: ['Алдымен жауырынды жақындатып, сосын қолды көтеріңіз', 'Мойын ұзын, көзқарас еденге', 'Бас бармақтар жоғары қарайды'] },
    keys: [
      { pose: { root: [90, 0, 0], lShoulder: [-165, 0, 30], rShoulder: [-165, 0, -30] }, move: 1.2, hold: 0.2 },
      { pose: { root: [90, 0, 0], lShoulder: [-192, 0, 30], rShoulder: [-192, 0, -30] }, move: 1, hold: 0.6 },
      { pose: { root: [90, 0, 0], lShoulder: [-165, 0, 30], rShoulder: [-165, 0, -30] }, move: 1, hold: 0.2 },
      { pose: { root: [90, 0, 0], lShoulder: [0, -5, 90], rShoulder: [0, 5, -90] }, move: 1.2, hold: 0.2 },
      { pose: { root: [90, 0, 0], lShoulder: [0, 30, 90], rShoulder: [0, -30, -90] }, move: 1, hold: 0.6 },
      { pose: { root: [90, 0, 0], lShoulder: [0, -5, 90], rShoulder: [0, 5, -90] }, move: 1, hold: 0.2 },
    ],
    anchors: ['root'], ground: 'min', props: [{ kind: 'mat' }],
    focus: ['lUpperArm', 'rUpperArm', 'torso'], camera: { pos: [2.2, 1.6, 1.8], target: [0, 0.15, 0.1] },
  },

  // ---------- Strength ----------
  {
    id: 'goblet-squat', group: 'strength',
    ru: { title: 'Приседания с гантелью у груди', dose: '3–4 × 4–6 (тяжёлый вес) или 3 × 10–12', cues: ['Пятки на полу, колени по направлению носков', 'Грудь вверх, спина нейтральная', 'Глубина — пока спина остаётся ровной'] },
    kk: { title: 'Гантельді кеудеде ұстап отыру', dose: '3–4 × 4–6 (ауыр салмақ) немесе 3 × 10–12', cues: ['Өкше еденде, тізе аяқ ұшымен бір бағытта', 'Кеуде жоғары, арқа бейтарап'] },
    keys: [
      { pose: { lShoulder: [-55, 0, 12], rShoulder: [-55, 0, -12], lElbow: [-110, 0, 0], rElbow: [-110, 0, 0] }, move: 1.2, hold: 0.5 },
      { pose: { spine: [30, 0, 0], lHip: [-105, 0, 10], rHip: [-105, 0, -10], lKnee: [120, 0, 0], rKnee: [120, 0, 0], lAnkle: [-15, 0, 0], rAnkle: [-15, 0, 0], lShoulder: [-75, 0, 12], rShoulder: [-75, 0, -12], lElbow: [-110, 0, 0], rElbow: [-110, 0, 0] }, move: 1.8, hold: 0.4 },
    ],
    anchors: ['lAnkle', 'rAnkle'], ground: SOLE,
    focus: ['lThigh', 'rThigh', 'pelvis'],
  },
  {
    id: 'rdl', group: 'strength',
    ru: { title: 'Румынская тяга', dose: '3–4 × 4–6 или 3 × 8–10', cues: ['Таз назад, колени слегка согнуты', 'Гриф или гантели скользят вдоль ног', 'Чувствуете натяжение задней поверхности бедра — поднимайтесь'] },
    kk: { title: 'Румын тартылысы', dose: '3–4 × 4–6 немесе 3 × 8–10', cues: ['Жамбас артқа, тізе сәл бүгілген', 'Салмақ аяқ бойымен сырғиды'] },
    keys: [
      { pose: { lKnee: [5, 0, 0], rKnee: [5, 0, 0], ...ARMS_DOWN }, move: 1.4, hold: 0.5 },
      { pose: { root: [70, 0, 0], lHip: [-66, 0, 4], rHip: [-66, 0, -4], lKnee: [12, 0, 0], rKnee: [12, 0, 0], lAnkle: [-12, 0, 0], rAnkle: [-12, 0, 0], lShoulder: [-70, 0, 4], rShoulder: [-70, 0, -4] }, move: 2, hold: 0.4 },
    ],
    anchors: ['lAnkle', 'rAnkle'], ground: SOLE,
    focus: ['pelvis', 'lThigh', 'rThigh'], camera: { pos: [3.2, 1.35, 1.5], target: [0, 0.75, 0] },
  },
  {
    id: 'reverse-lunge', group: 'strength',
    ru: { title: 'Выпад назад', dose: '3 × 8 на ногу', cues: ['Шаг назад, корпус прямо', 'Переднее колено над стопой', 'Возвращайтесь, отталкиваясь передней ногой'] },
    kk: { title: 'Артқа қарай кең адым', dose: 'Әр аяққа 3 × 8', cues: ['Артқа адым, дене тік', 'Алдыңғы тізе табан үстінде'] },
    keys: [
      { pose: { ...ARMS_DOWN }, move: 1.3, hold: 0.5 },
      { pose: { lHip: [-80, 0, 4], lKnee: [90, 0, 0], lAnkle: [-10, 0, 0], rHip: [10, 0, -4], rKnee: [100, 0, 0], rAnkle: [-20, 0, 0], ...ARMS_DOWN }, move: 1.6, hold: 0.4 },
    ],
    anchors: ['lAnkle'], ground: SOLE,
    focus: ['lThigh', 'pelvis'],
  },
  {
    id: 'plank', group: 'strength',
    ru: { title: 'Планка на предплечьях', dose: '3 × 30–45 с', cues: ['Локти под плечами', 'Тело в одну линию, таз не проваливается', 'Напрягите ягодицы и живот'] },
    kk: { title: 'Білекке сүйеніп планка', dose: '3 × 30–45 с', cues: ['Шынтақ иықтың астында', 'Дене бір сызықта, жамбас түспейді'] },
    keys: [
      { pose: { root: [80, 0, 0], lShoulder: [-80, 0, 8], rShoulder: [-80, 0, -8], lElbow: [-90, 0, 0], rElbow: [-90, 0, 0], lAnkle: [12, 0, 0], rAnkle: [12, 0, 0] }, move: 1, hold: 2.5 },
      { pose: { root: [78, 0, 0], lShoulder: [-78, 0, 8], rShoulder: [-78, 0, -8], lElbow: [-90, 0, 0], rElbow: [-90, 0, 0], lAnkle: [12, 0, 0], rAnkle: [12, 0, 0] }, move: 1.2, hold: 2.5 },
    ],
    anchors: ['lElbow', 'rElbow'], ground: 'min', props: [{ kind: 'mat' }],
    focus: ['torso', 'pelvis'], camera: { pos: [2.7, 1.0, 0.3], target: [0, 0.3, -0.65] },
  },
];

export const EXERCISE_BY_ID = Object.fromEntries(EXERCISES.map((e) => [e.id, e])) as Record<string, Exercise>;

export const GROUPS: { id: Group; ru: string; kk: string }[] = [
  { id: 'knee', ru: 'Колени', kk: 'Тізе' },
  { id: 'hip', ru: 'Таз и корпус', kk: 'Жамбас және дене' },
  { id: 'calf', ru: 'Икры, ахилл, стопа', kk: 'Балтыр, ахилл, табан' },
  { id: 'shoulder', ru: 'Плечо пловца', kk: 'Жүзушінің иығы' },
  { id: 'strength', ru: 'Силовая', kk: 'Күш жаттығулары' },
];
