export interface LanguageOption {
  code: string;
  locale: string;
  name: string;
}

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: "es", locale: "es-ES", name: "Español" },
  { code: "en", locale: "en-US", name: "English" },
  { code: "de", locale: "de-DE", name: "Deutsch" },
  { code: "it", locale: "it-IT", name: "Italiano" },
  { code: "fr", locale: "fr-FR", name: "Français" },
  { code: "pt", locale: "pt-PT", name: "Português" },
  { code: "ca", locale: "ca-ES", name: "Català" },
  { code: "nl", locale: "nl-NL", name: "Nederlands" },
  { code: "pl", locale: "pl-PL", name: "Polski" },
  { code: "sv", locale: "sv-SE", name: "Svenska" },
  { code: "da", locale: "da-DK", name: "Dansk" },
  { code: "nb", locale: "nb-NO", name: "Norsk" },
  { code: "fi", locale: "fi-FI", name: "Suomi" },
  { code: "cs", locale: "cs-CZ", name: "Čeština" },
  { code: "hu", locale: "hu-HU", name: "Magyar" },
  { code: "ro", locale: "ro-RO", name: "Română" },
  { code: "tr", locale: "tr-TR", name: "Türkçe" },
  { code: "el", locale: "el-GR", name: "Ελληνικά" },
  { code: "ru", locale: "ru-RU", name: "Русский" },
  { code: "uk", locale: "uk-UA", name: "Українська" },
  { code: "bg", locale: "bg-BG", name: "Български" },
  { code: "ar", locale: "ar", name: "العربية" },
  { code: "he", locale: "he-IL", name: "עברית" },
  { code: "hi", locale: "hi-IN", name: "हिन्दी" },
  { code: "th", locale: "th-TH", name: "ไทย" },
  { code: "vi", locale: "vi-VN", name: "Tiếng Việt" },
  { code: "id", locale: "id-ID", name: "Indonesia" },
  { code: "zh", locale: "zh-CN", name: "中文" },
  { code: "ja", locale: "ja-JP", name: "日本語" },
  { code: "ko", locale: "ko-KR", name: "한국어" },
];

const STOPWORDS: Record<string, string[]> = {
  es: ["que", "los", "las", "una", "para", "como", "está", "están", "también", "pero", "este", "esta", "desde", "hasta", "cuando", "porque", "sobre", "entre", "todos", "puede", "según", "después", "aunque", "siempre", "ahora", "aquí", "más", "del", "por", "con", "sus", "sin", "muy", "hay", "son", "uno"],
  en: ["the", "and", "that", "have", "with", "this", "from", "they", "would", "there", "their", "what", "which", "about", "could", "should", "been", "were", "will", "more", "when", "your", "them", "some", "into", "than", "then", "these", "not", "are"],
  de: ["und", "der", "die", "das", "den", "dem", "nicht", "sich", "auch", "auf", "für", "ist", "von", "mit", "ein", "eine", "als", "bei", "nach", "oder", "wie", "zur", "zum", "über", "werden", "wurde", "kann", "noch", "nur", "wenn", "sind"],
  fr: ["les", "des", "une", "que", "qui", "dans", "pour", "pas", "plus", "avec", "sont", "cette", "aux", "par", "est", "vous", "nous", "mais", "tout", "elle", "ils", "comme", "aussi", "leur", "ses", "dont", "sur", "une"],
  it: ["che", "non", "una", "per", "con", "del", "della", "sono", "come", "più", "anche", "alla", "degli", "delle", "questo", "questa", "nella", "nel", "dei", "essere", "hanno", "tutto", "tutti", "quando", "dove", "dopo", "della"],
  pt: ["que", "não", "uma", "para", "com", "por", "como", "mais", "também", "está", "estão", "pela", "pelo", "isso", "mas", "dos", "das", "quando", "muito", "já", "sobre", "entre", "foi", "ser", "os", "as", "em", "ao", "na", "no", "tem", "você", "da", "do"],
  ca: ["que", "els", "les", "una", "per", "amb", "com", "està", "també", "però", "aquest", "aquesta", "dels", "dels", "després", "quan", "perquè", "sobre", "entre", "més", "són", "del"],
  nl: ["het", "van", "een", "dat", "niet", "voor", "met", "zijn", "er", "op", "te", "als", "aan", "om", "bij", "ook", "maar", "dan", "nog", "wel", "deze", "wordt", "kan", "uit"],
  pl: ["się", "nie", "jest", "jak", "ale", "czy", "oraz", "tylko", "przez", "tego", "może", "już", "gdy", "także", "być", "jego", "jej", "ich", "dla", "przy"],
  sv: ["och", "att", "det", "som", "för", "på", "är", "av", "en", "inte", "den", "har", "med", "om", "ett", "kan", "från", "till", "var", "ska"],
  da: ["og", "at", "det", "er", "til", "på", "af", "en", "ikke", "den", "har", "med", "for", "de", "som", "et", "kan", "fra", "var", "skal"],
  nb: ["og", "at", "det", "er", "til", "på", "av", "en", "ikke", "den", "har", "med", "for", "de", "som", "et", "kan", "fra", "var", "skal"],
  fi: ["että", "on", "ei", "ja", "se", "hän", "oli", "kun", "mutta", "niin", "jos", "tai", "myös", "vain", "ovat", "tämä", "sen", "voi"],
  cs: ["že", "se", "na", "je", "jsou", "jako", "pro", "ale", "si", "by", "kdo", "také", "jeho", "její", "nebo", "už", "při", "jen"],
  hu: ["hogy", "nem", "egy", "van", "azt", "meg", "már", "csak", "vagy", "lehet", "volt", "olyan", "ezt", "még", "kell", "mint"],
  ro: ["că", "nu", "sunt", "pentru", "este", "din", "ale", "lui", "sau", "mai", "cum", "când", "acest", "această", "să", "pe"],
  tr: ["bir", "bu", "ve", "için", "ile", "değil", "daha", "ama", "gibi", "çok", "olarak", "var", "kadar", "sonra", "olan", "ise"],
  el: ["και", "το", "την", "της", "να", "που", "με", "για", "στο", "από", "είναι", "δεν", "του", "τα"],
  ru: ["и", "в", "не", "на", "что", "с", "как", "это", "по", "но", "он", "она", "они", "из", "за", "от", "для", "его", "её", "бы"],
  uk: ["і", "в", "не", "на", "що", "з", "як", "це", "але", "він", "вона", "вони", "від", "для", "його", "її", "та", "про"],
  bg: ["и", "на", "да", "се", "не", "за", "от", "че", "с", "е", "като", "то", "те", "ще", "са"],
  vi: ["và", "của", "các", "là", "có", "không", "được", "trong", "một", "này", "cho", "với", "để", "người"],
  id: ["yang", "dan", "di", "itu", "dengan", "untuk", "tidak", "ini", "dari", "pada", "akan", "adalah", "sebagai", "juga"],
};

const SCRIPT_HINTS: { re: RegExp; code: string }[] = [
  { re: /[\u3040-\u30FF]/g, code: "ja" },
  { re: /[\uAC00-\uD7AF]/g, code: "ko" },
  { re: /[\u4E00-\u9FFF]/g, code: "zh" },
  { re: /[\u0600-\u06FF]/g, code: "ar" },
  { re: /[\u0590-\u05FF]/g, code: "he" },
  { re: /[\u0E00-\u0E7F]/g, code: "th" },
  { re: /[\u0900-\u097F]/g, code: "hi" },
  { re: /[\u0370-\u03FF]/g, code: "el" },
];

function optionByCode(code: string): LanguageOption {
  return LANGUAGE_OPTIONS.find((item) => item.code === code) ?? LANGUAGE_OPTIONS[0];
}

function tokenize(text: string): string[] {
  return text
    .toLocaleLowerCase()
    .match(/[\p{L}\p{M}]+/gu)
    ?.filter((token) => token.length > 1) ?? [];
}

function scriptLanguage(text: string): string | null {
  let best: { code: string; count: number } | null = null;
  for (const hint of SCRIPT_HINTS) {
    const count = text.match(hint.re)?.length ?? 0;
    if (count >= 8 && (!best || count > best.count)) {
      best = { code: hint.code, count };
    }
  }
  return best?.code ?? null;
}

function cyrillicLanguage(tokens: string[]): string | null {
  const cyrillic = tokens.filter((token) => /[\u0400-\u04FF]/.test(token));
  if (cyrillic.length < 8) return null;

  const scores: Record<string, number> = { ru: 0, uk: 0, bg: 0 };
  for (const token of cyrillic) {
    for (const code of Object.keys(scores)) {
      if (STOPWORDS[code]?.includes(token)) scores[code] += 1;
    }
  }
  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  return ranked[0] && ranked[0][1] > 0 ? ranked[0][0] : "ru";
}

export function detectLanguage(text: string): LanguageOption {
  const sample = text.slice(0, 12000).trim();
  if (sample.length < 24) {
    return optionByCode(navigator.language.slice(0, 2) || "es");
  }

  const fromScript = scriptLanguage(sample);
  if (fromScript) return optionByCode(fromScript);

  const tokens = tokenize(sample);
  if (tokens.length < 8) {
    return optionByCode(navigator.language.slice(0, 2) || "es");
  }

  const fromCyrillic = cyrillicLanguage(tokens);
  if (fromCyrillic) return optionByCode(fromCyrillic);

  const scores = new Map<string, number>();
  for (const [code, words] of Object.entries(STOPWORDS)) {
    const set = new Set(words);
    let score = 0;
    for (const token of tokens) {
      if (set.has(token)) score += 1;
    }
    scores.set(code, score / Math.max(tokens.length, 1));
  }

  const ranked = [...scores.entries()].sort((a, b) => b[1] - a[1]);
  const [bestCode, bestScore] = ranked[0] ?? ["es", 0];
  if (bestScore < 0.02) {
    return optionByCode(navigator.language.slice(0, 2) || "es");
  }
  return optionByCode(bestCode);
}

export function languageByCode(code: string): LanguageOption {
  return optionByCode(code);
}
