// Spoken word -> an icon for the `sticker` effect: `icon:<name>` = a Phosphor icon (src/icon-paths.json)
// drawn as glowing dots, like the references' dot-matrix objects. Expert reels show the thing that is
// named, not a text card about it — and icons, not emoji.
// Stems match the start of a word ("=word" = the whole word only), Russian and English; the first matching row wins.

const STEMS = [
  ["lightbulb", "идея идеи идею идей лампоч придум insight idea"],
  ["users-three", "команд коллег сотрудник люд team people staff"],
  ["handshake", "партн сделк договор клиент partner deal client"],
  ["robot", "технолог робот нейросет =ии =ai automat tech robot"],
  ["brain", "мозг умн знани мысл brain smart mind"],
  ["laptop", "ноутбук компьют сайт программ код laptop computer code website"],
  ["device-mobile", "телефон смартфон приложен phone =app apps mobile"],
  ["money", "деньг доход прибыл заработ выручк money profit income revenue"],
  ["currency-dollar", "доллар dollar"],
  ["coin", "=сом сомов копе монет coin cent"],
  ["credit-card", "оплат подписк карт payment subscription card"],
  ["shopping-cart", "покуп продаж магазин продук buy sale shop product"],
  ["trend-up", "рост вырос растет growth grow"],
  ["trend-down", "провал падени упал кризис убыт fail crash loss crisis"],
  ["chart-bar", "статист аналит цифр метрик data stats metric number"],
  ["lightning", "ошибк удар конфликт ругал mistake error conflict"],
  ["bomb", "взрыв опасн danger explod"],
  ["warning", "риск внимани осторожн risk warning careful"],
  ["x-circle", "нельз запрет отказ wrong reject"],
  ["check-circle", "решени правильн готов сделал done right decision"],
  ["flask", "тест протест эксперимент гипотез test experiment hypothes"],
  ["arrows-clockwise", "переформат заново повтор итерац retry iterat again"],
  ["magnifying-glass", "иска поиск найт исслед search research find"],
  ["plant", "маленьк начал старт малень small begin start seed"],
  ["rocket-launch", "запуск стартап взлет launch startup"],
  ["horse", "единорог unicorn"],
  ["trophy", "успех побед лучш чемпион success win best"],
  ["crown", "лидер корол первы leader king first"],
  ["diamond", "ценн качеств преми value quality premium"],
  ["medal", "идеальн отличн perfect"],
  ["timer", "быстр скорост успет минут fast speed quick minute"],
  ["hourglass-medium", "время врем отлож ждать подожд time wait delay"],
  ["alarm", "утр будильн дедлайн срок morning deadline"],
  ["calendar-blank", "дней =дня недел месяц =год года =лет календ day week month year"],
  ["hourglass-low", "медлен долг slow"],
  ["couch", "ничего лень диван отдых lazy rest nothing"],
  ["bed", "спать сон устал sleep tired"],
  ["fire", "огон горит хайп тренд fire hot trend"],
  ["sparkle", "магия волшеб magic"],
  ["confetti", "праздн отмет поздрав party celebrat"],
  ["heart", "любов люблю сердц любим love heart"],
  ["mountains", "цель цели целью вершин goal peak mountain"],
  ["flag-checkered", "финиш итог результат finish result"],
  ["shield-check", "защит безопас protect safe"],
  ["key", "ключ секрет key secret"],
  ["lock", "закрыт доступ lock access"],
  ["gear", "процесс систем настро механ process system setup"],
  ["wrench", "строи инструмент делать сдела build tool make"],
  ["puzzle-piece", "задач проблем пазл problem task puzzle"],
  ["package", "доставк посылк delivery package"],
  ["stack", "основ фундамент кирпич base foundation"],
  ["graduation-cap", "учеб студент универ курс обучен school student course study"],
  ["books", "книг читат book read"],
  ["globe-hemisphere-west", "мир стран глобал международ world country global"],
  ["house", "дом квартир home house"],
  ["buildings", "компан офис бизнес company office business"],
  ["megaphone", "реклам маркетинг объяв marketing ads announce"],
  ["chat-circle", "сказал говор вопрос отзыв said ask question review"],
  ["video-camera", "видео рилс съемк video reel film"],
  ["question", "думат подума почему think why"],
  ["smiley-x-eyes", "шок удив невероят shock wow insane"],
  ["smiley-nervous", "страх боя страшн fear scar afraid"],
  ["eye", "заметил заметила понял поняла realiz notic"],
  ["snowflake", "холод зим cold winter"],
  ["battery-charging", "энерги сил заряд energy power"],
  ["star", "звезд мечт star dream"],
  ["gift", "подар бонус бесплат gift bonus free"],
].map(([icon, stems]) => [icon, stems.split(" ")]);

const clean = (w) => w.toLowerCase().replace(/ё/g, "е").replace(/[^\p{L}\p{N}-]/gu, "");

// one word -> icon name, or null
export function iconFor(word) {
  const w = clean(word);
  if (!w) return null;
  // "=word" matches only the whole word (short ones like ии, сом, год)
  const hit = (s) => (s.startsWith("=") ? w === s.slice(1) : w.length >= 3 && w.startsWith(s));
  for (const [icon, stems] of STEMS) if (stems.some(hit)) return icon;
  return null;
}

// first icon named in words[i..i+n] -> { src, at } (at = when that word is said), or null
export function stickerAt(words, i, n = 3, skip = new Set()) {
  for (const w of words.slice(i, i + n)) {
    const icon = iconFor(w.w);
    if (icon && !skip.has(icon)) return { src: `icon:${icon}`, icon, at: w.s };
  }
  return null;
}
