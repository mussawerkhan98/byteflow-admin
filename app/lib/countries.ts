/**
 * ISO 3166 country list, the aliases people actually type, and the calling
 * codes used to guess a country from a phone number.
 *
 * Deliberately free of imports so it can be used from the browser, from the
 * server and from tests without pulling in the database layer.
 */

/** [ISO 3166-1 alpha-2, canonical name, calling code] */
const COUNTRY_TABLE: readonly (readonly [string, string, string])[] = [
  ["AF", "Afghanistan", "93"], ["AL", "Albania", "355"], ["DZ", "Algeria", "213"],
  ["AD", "Andorra", "376"], ["AO", "Angola", "244"], ["AG", "Antigua and Barbuda", "1268"],
  ["AR", "Argentina", "54"], ["AM", "Armenia", "374"], ["AU", "Australia", "61"],
  ["AT", "Austria", "43"], ["AZ", "Azerbaijan", "994"], ["BS", "Bahamas", "1242"],
  ["BH", "Bahrain", "973"], ["BD", "Bangladesh", "880"], ["BB", "Barbados", "1246"],
  ["BY", "Belarus", "375"], ["BE", "Belgium", "32"], ["BZ", "Belize", "501"],
  ["BJ", "Benin", "229"], ["BT", "Bhutan", "975"], ["BO", "Bolivia", "591"],
  ["BA", "Bosnia and Herzegovina", "387"], ["BW", "Botswana", "267"], ["BR", "Brazil", "55"],
  ["BN", "Brunei", "673"], ["BG", "Bulgaria", "359"], ["BF", "Burkina Faso", "226"],
  ["BI", "Burundi", "257"], ["KH", "Cambodia", "855"], ["CM", "Cameroon", "237"],
  ["CA", "Canada", "1"], ["CV", "Cape Verde", "238"], ["CF", "Central African Republic", "236"],
  ["TD", "Chad", "235"], ["CL", "Chile", "56"], ["CN", "China", "86"],
  ["CO", "Colombia", "57"], ["KM", "Comoros", "269"], ["CG", "Congo", "242"],
  ["CD", "Congo (DRC)", "243"], ["CR", "Costa Rica", "506"], ["CI", "Côte d'Ivoire", "225"],
  ["HR", "Croatia", "385"], ["CU", "Cuba", "53"], ["CY", "Cyprus", "357"],
  ["CZ", "Czechia", "420"], ["DK", "Denmark", "45"], ["DJ", "Djibouti", "253"],
  ["DM", "Dominica", "1767"], ["DO", "Dominican Republic", "1809"], ["EC", "Ecuador", "593"],
  ["EG", "Egypt", "20"], ["SV", "El Salvador", "503"], ["GQ", "Equatorial Guinea", "240"],
  ["ER", "Eritrea", "291"], ["EE", "Estonia", "372"], ["SZ", "Eswatini", "268"],
  ["ET", "Ethiopia", "251"], ["FJ", "Fiji", "679"], ["FI", "Finland", "358"],
  ["FR", "France", "33"], ["GA", "Gabon", "241"], ["GM", "Gambia", "220"],
  ["GE", "Georgia", "995"], ["DE", "Germany", "49"], ["GH", "Ghana", "233"],
  ["GR", "Greece", "30"], ["GD", "Grenada", "1473"], ["GT", "Guatemala", "502"],
  ["GN", "Guinea", "224"], ["GW", "Guinea-Bissau", "245"], ["GY", "Guyana", "592"],
  ["HT", "Haiti", "509"], ["HN", "Honduras", "504"], ["HK", "Hong Kong", "852"],
  ["HU", "Hungary", "36"], ["IS", "Iceland", "354"], ["IN", "India", "91"],
  ["ID", "Indonesia", "62"], ["IR", "Iran", "98"], ["IQ", "Iraq", "964"],
  ["IE", "Ireland", "353"], ["IL", "Israel", "972"], ["IT", "Italy", "39"],
  ["JM", "Jamaica", "1876"], ["JP", "Japan", "81"], ["JO", "Jordan", "962"],
  ["KZ", "Kazakhstan", "7"], ["KE", "Kenya", "254"], ["KI", "Kiribati", "686"],
  ["KW", "Kuwait", "965"], ["KG", "Kyrgyzstan", "996"], ["LA", "Laos", "856"],
  ["LV", "Latvia", "371"], ["LB", "Lebanon", "961"], ["LS", "Lesotho", "266"],
  ["LR", "Liberia", "231"], ["LY", "Libya", "218"], ["LI", "Liechtenstein", "423"],
  ["LT", "Lithuania", "370"], ["LU", "Luxembourg", "352"], ["MO", "Macao", "853"],
  ["MG", "Madagascar", "261"], ["MW", "Malawi", "265"], ["MY", "Malaysia", "60"],
  ["MV", "Maldives", "960"], ["ML", "Mali", "223"], ["MT", "Malta", "356"],
  ["MH", "Marshall Islands", "692"], ["MR", "Mauritania", "222"], ["MU", "Mauritius", "230"],
  ["MX", "Mexico", "52"], ["FM", "Micronesia", "691"], ["MD", "Moldova", "373"],
  ["MC", "Monaco", "377"], ["MN", "Mongolia", "976"], ["ME", "Montenegro", "382"],
  ["MA", "Morocco", "212"], ["MZ", "Mozambique", "258"], ["MM", "Myanmar", "95"],
  ["NA", "Namibia", "264"], ["NR", "Nauru", "674"], ["NP", "Nepal", "977"],
  ["NL", "Netherlands", "31"], ["NZ", "New Zealand", "64"], ["NI", "Nicaragua", "505"],
  ["NE", "Niger", "227"], ["NG", "Nigeria", "234"], ["KP", "North Korea", "850"],
  ["MK", "North Macedonia", "389"], ["NO", "Norway", "47"], ["OM", "Oman", "968"],
  ["PK", "Pakistan", "92"], ["PW", "Palau", "680"], ["PS", "Palestine", "970"],
  ["PA", "Panama", "507"], ["PG", "Papua New Guinea", "675"], ["PY", "Paraguay", "595"],
  ["PE", "Peru", "51"], ["PH", "Philippines", "63"], ["PL", "Poland", "48"],
  ["PT", "Portugal", "351"], ["QA", "Qatar", "974"], ["RO", "Romania", "40"],
  ["RU", "Russia", "7"], ["RW", "Rwanda", "250"], ["KN", "Saint Kitts and Nevis", "1869"],
  ["LC", "Saint Lucia", "1758"], ["VC", "Saint Vincent and the Grenadines", "1784"],
  ["WS", "Samoa", "685"], ["SM", "San Marino", "378"], ["ST", "Sao Tome and Principe", "239"],
  ["SA", "Saudi Arabia", "966"], ["SN", "Senegal", "221"], ["RS", "Serbia", "381"],
  ["SC", "Seychelles", "248"], ["SL", "Sierra Leone", "232"], ["SG", "Singapore", "65"],
  ["SK", "Slovakia", "421"], ["SI", "Slovenia", "386"], ["SB", "Solomon Islands", "677"],
  ["SO", "Somalia", "252"], ["ZA", "South Africa", "27"], ["KR", "South Korea", "82"],
  ["SS", "South Sudan", "211"], ["ES", "Spain", "34"], ["LK", "Sri Lanka", "94"],
  ["SD", "Sudan", "249"], ["SR", "Suriname", "597"], ["SE", "Sweden", "46"],
  ["CH", "Switzerland", "41"], ["SY", "Syria", "963"], ["TW", "Taiwan", "886"],
  ["TJ", "Tajikistan", "992"], ["TZ", "Tanzania", "255"], ["TH", "Thailand", "66"],
  ["TL", "Timor-Leste", "670"], ["TG", "Togo", "228"], ["TO", "Tonga", "676"],
  ["TT", "Trinidad and Tobago", "1868"], ["TN", "Tunisia", "216"], ["TR", "Turkey", "90"],
  ["TM", "Turkmenistan", "993"], ["TV", "Tuvalu", "688"], ["UG", "Uganda", "256"],
  ["UA", "Ukraine", "380"], ["AE", "United Arab Emirates", "971"], ["GB", "United Kingdom", "44"],
  ["US", "United States", "1"], ["UY", "Uruguay", "598"], ["UZ", "Uzbekistan", "998"],
  ["VU", "Vanuatu", "678"], ["VA", "Vatican City", "379"], ["VE", "Venezuela", "58"],
  ["VN", "Vietnam", "84"], ["YE", "Yemen", "967"], ["ZM", "Zambia", "260"],
  ["ZW", "Zimbabwe", "263"],
] as const;

export type Country = { code: string; name: string; dial: string };

export const COUNTRIES: Country[] = COUNTRY_TABLE.map(([code, name, dial]) => ({
  code,
  name,
  dial,
}));

export const COUNTRY_NAMES: string[] = COUNTRIES.map((country) => country.name);

/**
 * What people type instead of the canonical name. Cities and emirates are
 * included deliberately — "Dubai" in a country column is extremely common in
 * this market and means the UAE.
 */
const ALIASES: Record<string, string> = {
  uae: "United Arab Emirates",
  "u.a.e": "United Arab Emirates",
  "u.a.e.": "United Arab Emirates",
  "united arab emirate": "United Arab Emirates",
  emirates: "United Arab Emirates",
  dubai: "United Arab Emirates",
  "abu dhabi": "United Arab Emirates",
  abudhabi: "United Arab Emirates",
  sharjah: "United Arab Emirates",
  ajman: "United Arab Emirates",
  fujairah: "United Arab Emirates",
  "ras al khaimah": "United Arab Emirates",
  "umm al quwain": "United Arab Emirates",
  ksa: "Saudi Arabia",
  "k.s.a": "Saudi Arabia",
  saudi: "Saudi Arabia",
  "saudi arabia": "Saudi Arabia",
  "kingdom of saudi arabia": "Saudi Arabia",
  riyadh: "Saudi Arabia",
  jeddah: "Saudi Arabia",
  uk: "United Kingdom",
  "u.k": "United Kingdom",
  "u.k.": "United Kingdom",
  england: "United Kingdom",
  scotland: "United Kingdom",
  wales: "United Kingdom",
  "northern ireland": "United Kingdom",
  britain: "United Kingdom",
  "great britain": "United Kingdom",
  gb: "United Kingdom",
  london: "United Kingdom",
  usa: "United States",
  "u.s.a": "United States",
  "u.s.a.": "United States",
  us: "United States",
  "u.s.": "United States",
  america: "United States",
  "united states of america": "United States",
  türkiye: "Turkey",
  turkiye: "Turkey",
  "republic of turkey": "Turkey",
  holland: "Netherlands",
  "the netherlands": "Netherlands",
  "czech republic": "Czechia",
  "south korea": "South Korea",
  "republic of korea": "South Korea",
  korea: "South Korea",
  "north korea": "North Korea",
  swaziland: "Eswatini",
  burma: "Myanmar",
  "ivory coast": "Côte d'Ivoire",
  "cote d'ivoire": "Côte d'Ivoire",
  "cote divoire": "Côte d'Ivoire",
  "cape verde": "Cape Verde",
  "cabo verde": "Cape Verde",
  "drc": "Congo (DRC)",
  "democratic republic of the congo": "Congo (DRC)",
  "east timor": "Timor-Leste",
  "vatican": "Vatican City",
  "holy see": "Vatican City",
  "russian federation": "Russia",
  "hong kong sar": "Hong Kong",
  "macau": "Macao",
  "egypt arab republic": "Egypt",
  india: "India",
  bharat: "India",
  "philipines": "Philippines",
  "phillipines": "Philippines",
};

const BY_LOWER_NAME = new Map(
  COUNTRIES.map((country) => [country.name.toLowerCase(), country.name]),
);
const BY_CODE = new Map(COUNTRIES.map((country) => [country.code, country.name]));

/**
 * Turn whatever was typed into one canonical country name. Returns '' when
 * nothing recognisable was supplied, so a blank stays blank rather than
 * becoming a wrong guess.
 */
export function normaliseCountry(input: unknown): string {
  const raw = String(input ?? "").trim();
  if (!raw) return "";
  const key = raw.toLowerCase().replace(/\s+/g, " ");
  const exact = BY_LOWER_NAME.get(key);
  if (exact) return exact;
  const alias = ALIASES[key];
  if (alias) return alias;
  // A bare 2-letter code, but only when it really is one — "US" is a country,
  // "XX" is not, and a longer word that happens to start with one is not.
  if (/^[a-z]{2}$/.test(key)) {
    const byCode = BY_CODE.get(key.toUpperCase());
    if (byCode) return byCode;
  }
  const withoutPunctuation = key.replace(/[.,]/g, "").trim();
  if (withoutPunctuation !== key) return normaliseCountry(withoutPunctuation);
  return "";
}

/**
 * Some calling codes are shared. +1 covers the whole North American plan and
 * +7 covers both Russia and Kazakhstan; the code alone cannot tell them
 * apart, so each ambiguous code names the country to assume. The longer
 * Caribbean codes (+1268 and friends) are unambiguous and still win, because
 * matching tries the longest code first.
 */
const PRIMARY_FOR_DIAL: Record<string, string> = {
  "1": "United States",
  "7": "Russia",
};

/**
 * Longest calling code first, with the preferred country ahead of any it
 * shares its code with.
 *
 * The comparison is a strict total order — length, then the code itself, then
 * whether it is the preferred country, then the name. Ranking "preferred"
 * above "alphabetical" directly would be inconsistent (United States before
 * Canada before Kazakhstan before United States), and an inconsistent
 * comparator makes sort() return whatever it likes.
 */
const BY_DIAL_LENGTH = [...COUNTRIES].sort((a, b) => {
  if (b.dial.length !== a.dial.length) return b.dial.length - a.dial.length;
  if (a.dial !== b.dial) return a.dial.localeCompare(b.dial);
  const primary = PRIMARY_FOR_DIAL[a.dial];
  if (primary === a.name) return -1;
  if (primary === b.name) return 1;
  return a.name.localeCompare(b.name);
});

/**
 * Best-effort country from a phone number's calling code. Longer codes are
 * tried first so +1268 (Antigua) is not mistaken for +1 (United States).
 */
export function countryFromPhone(phone: unknown): string {
  const digits = String(phone ?? "").replace(/[^\d]/g, "");
  if (!digits) return "";
  // Numbers are often stored with a leading 00 international prefix.
  const national = digits.startsWith("00") ? digits.slice(2) : digits;
  for (const country of BY_DIAL_LENGTH) {
    if (national.startsWith(country.dial)) return country.name;
  }
  return "";
}

/** The country to store, preferring what was typed and falling back to the phone. */
export function resolveCountry(country: unknown, phone: unknown): string {
  return normaliseCountry(country) || countryFromPhone(phone);
}
