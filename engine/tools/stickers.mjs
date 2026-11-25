// Spoken word -> a real 3D icon for the `sticker` effect (Fluent Emoji 3D in public/assets/icons).
// Expert reels show the thing that is named, not a text card about it.
// Stems match the start of a word ("=word" = the whole word only), Russian and English; the first matching row wins.

export const ICON_DIR = "assets/icons";

const STEMS = [
  ["light_bulb", "идея идеи идею идей лампоч придум insight idea"],
  ["busts_in_silhouette", "команд коллег сотрудник люд team people staff"],
  ["handshake", "партн сделк договор клиент partner deal client"],
  ["robot", "технолог робот нейросет =ии =ai automat tech robot"],
  ["brain", "мозг умн знани мысл brain smart mind"],
  ["laptop", "ноутбук компьют сайт программ код laptop computer code website"],
  ["mobile_phone", "телефон смартфон приложен phone =app apps mobile"],
  ["money_bag", "деньг доход прибыл заработ выручк money profit income revenue"],
  ["dollar_banknote", "доллар dollar"],
  ["coin", "=сом сомов копе монет coin cent"],
  ["credit_card", "оплат подписк карт payment subscription card"],
  ["shopping_cart", "покуп продаж магазин продук buy sale shop product"],
  ["chart_increasing", "рост вырос растет growth grow"],
  ["chart_decreasing", "провал падени упал кризис убыт fail crash loss crisis"],
  ["bar_chart", "статист аналит цифр метрик data stats metric number"],
  ["collision", "ошибк удар конфликт ругал mistake error conflict"],
  ["bomb", "взрыв опасн danger explod"],
  ["warning", "риск внимани осторожн risk warning careful"],
  ["cross_mark", "нельз запрет отказ wrong reject"],
  ["check_mark_button", "решени правильн готов сделал done right decision"],
  ["test_tube", "тест протест эксперимент гипотез test experiment hypothes"],
  ["counterclockwise_arrows_button", "переформат заново повтор итерац retry iterat again"],
  ["magnifying_glass_tilted_left", "иска поиск найт исслед search research find"],
  ["seedling", "маленьк начал старт малень small begin start seed"],
  ["rocket", "запуск стартап взлет launch startup"],
  ["unicorn", "единорог unicorn"],
  ["trophy", "успех побед лучш чемпион success win best"],
  ["crown", "лидер корол первы leader king first"],
  ["gem_stone", "ценн качеств преми value quality premium"],
  ["hundred_points", "идеальн отличн perfect"],
  ["stopwatch", "быстр скорост успет минут fast speed quick minute"],
  ["hourglass_not_done", "время врем отлож ждать подожд time wait delay"],
  ["alarm_clock", "утр будильн дедлайн срок morning deadline"],
  ["calendar", "дней =дня недел месяц =год года =лет календ day week month year"],
  ["snail", "медлен долг slow"],
  ["couch_and_lamp", "ничего лень диван отдых lazy rest nothing"],
  ["zzz", "спать сон устал sleep tired"],
  ["fire", "огон горит хайп тренд fire hot trend"],
  ["sparkles", "магия волшеб magic"],
  ["party_popper", "праздн отмет поздрав party celebrat"],
  ["red_heart", "любов люблю сердц любим love heart"],
  ["mountain", "цель цели целью вершин goal peak mountain"],
  ["chequered_flag", "финиш итог результат finish result"],
  ["shield", "защит безопас protect safe"],
  ["key", "ключ секрет key secret"],
  ["locked", "закрыт доступ lock access"],
  ["gear", "процесс систем настро механ process system setup"],
  ["hammer_and_wrench", "строи инструмент делать сдела build tool make"],
  ["puzzle_piece", "задач проблем пазл problem task puzzle"],
  ["package", "доставк посылк delivery package"],
  ["brick", "основ фундамент кирпич base foundation"],
  ["graduation_cap", "учеб студент универ курс обучен school student course study"],
  ["books", "книг читат book read"],
  ["globe_showing_americas", "мир стран глобал международ world country global"],
  ["house", "дом квартир home house"],
  ["office_building", "компан офис бизнес company office business"],
  ["megaphone", "реклам маркетинг объяв marketing ads announce"],
  ["speech_balloon", "сказал говор вопрос отзыв said ask question review"],
  ["video_camera", "видео рилс съемк video reel film"],
  ["thinking_face", "думат подума почему think why"],
  ["exploding_head", "шок удив невероят shock wow insane"],
  ["face_screaming_in_fear", "страх боя страшн fear scar afraid"],
  ["face_with_monocle", "заметил заметила понял поняла realiz notic"],
  ["snowflake", "холод зим cold winter"],
  ["battery", "энерги сил заряд energy power"],
  ["star", "звезд мечт star dream"],
  ["wrapped_gift", "подар бонус бесплат gift bonus free"],
].map(([icon, stems]) => [icon, stems.split(" ")]);

const clean = (w) => w.toLowerCase().replace(/ё/g, "е").replace(/[^\p{L}\p{N}-]/gu, "");

// one word -> icon file name (without the folder), or null
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
    if (icon && !skip.has(icon)) return { src: `${ICON_DIR}/${icon}_3d.png`, icon, at: w.s };
  }
  return null;
}
