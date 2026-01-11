export const ipaToKatakana = {
    // Consonants
    'p': 'パ', 'b': 'バ', 't': 'タ', 'd': 'ダ', 'k': 'カ', 'g': 'ガ',
    'f': 'フ', 'v': 'ヴ', 's': 'サ', 'z': 'ザ', 'ʃ': 'シ', 'ʒ': 'ジ',
    'tʃ': 'チ', 'dʒ': 'ジ', 'θ': 'ス', 'ð': 'ズ', 'm': 'マ', 'n': 'ナ',
    'ŋ': 'ング', 'l': 'ラ', 'r': 'ラ', 'w': 'ワ', 'j': 'ヤ', 'h': 'ハ',

    // Vowels
    'æ': 'ア', 'ɑ': 'アー', 'ə': 'ア', 'ʌ': 'ア',
    'i': 'イ', 'iː': 'イー', 'ɪ': 'イ',
    'u': 'ウ', 'uː': 'ウー', 'ʊ': 'ウ',
    'e': 'エ', 'ɛ': 'エ', 'ɜː': 'アー',
    'o': 'オ', 'ɔ': 'オー', 'ɔː': 'オー',
    'aɪ': 'アイ', 'eɪ': 'エイ', 'ɔɪ': 'オイ', 'aʊ': 'アウ', 'oʊ': 'オウ', 'ju': 'ユー'
};

export function convertToKatakana(ipa) {
    if (!ipa) return null;

    // Clean IPA (remove stress marks, etc.)
    let clean = ipa.replace(/ˈ|ˌ/g, ''); // Remove stress

    let result = '';
    let i = 0;

    // Greedy match from the map
    while (i < clean.length) {
        let match = null;
        let matchLen = 0;

        // Attempt to match 2 chars first (e.g. diphthongs or complex consonants)
        if (i < clean.length - 1) {
            const two = clean.substr(i, 2);
            if (ipaToKatakana[two]) {
                match = ipaToKatakana[two];
                matchLen = 2;
            }
        }

        // If no 2-char match, try 1 char
        if (!match) {
            const one = clean.substr(i, 1);
            if (ipaToKatakana[one]) {
                match = ipaToKatakana[one];
                matchLen = 1;
            }
        }

        if (match) {
            result += match;
            i += matchLen;
        } else {
            // Skip unknown chars
            i++;
        }
    }

    return result;
}
