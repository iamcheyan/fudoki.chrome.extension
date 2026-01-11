export const arpabetToKatakanaMap = {
    // Consonants
    'P': 'パ', 'B': 'バ', 'T': 'タ', 'D': 'ダ', 'K': 'カ', 'G': 'ガ',
    'M': 'マ', 'N': 'ナ', 'NG': 'ング', 'F': 'フ', 'V': 'ヴ',
    'TH': 'ス', 'DH': 'ズ', 'S': 'サ', 'Z': 'ザ', 'SH': 'シ', 'ZH': 'ジ',
    'CH': 'チ', 'JH': 'ジ', 'L': 'ラ', 'R': 'ラ', 'Y': 'ヤ', 'W': 'ワ',
    'HH': 'ハ', 'DX': 'ダ',

    // Vowels (Approximate)
    'AA': 'アー', 'AA0': 'ア', 'AA1': 'アー', 'AA2': 'アー',
    'AE': 'ア', 'AE0': 'ア', 'AE1': 'ア', 'AE2': 'ア',
    'AH': 'ア', 'AH0': 'ア', 'AH1': 'ア', 'AH2': 'ア',
    'AO': 'オー', 'AO0': 'オ', 'AO1': 'オー', 'AO2': 'オー',
    'AW': 'アウ', 'AW0': 'アウ', 'AW1': 'アウ', 'AW2': 'アウ',
    'AY': 'アイ', 'AY0': 'アイ', 'AY1': 'アイ', 'AY2': 'アイ',
    'EH': 'エ', 'EH0': 'エ', 'EH1': 'エ', 'EH2': 'エ',
    'ER': 'アー', 'ER0': 'アー', 'ER1': 'アー', 'ER2': 'アー',
    'EY': 'エイ', 'EY0': 'エイ', 'EY1': 'エイ', 'EY2': 'エイ',
    'IH': 'イ', 'IH0': 'イ', 'IH1': 'イ', 'IH2': 'イ',
    'IY': 'イー', 'IY0': 'イ', 'IY1': 'イー', 'IY2': 'イー',
    'OW': 'オウ', 'OW0': 'オウ', 'OW1': 'オウ', 'OW2': 'オウ',
    'OY': 'オイ', 'OY0': 'オイ', 'OY1': 'オイ', 'OY2': 'オイ',
    'UH': 'ウ', 'UH0': 'ウ', 'UH1': 'ウ', 'UH2': 'ウ',
    'UW': 'ウー', 'UW0': 'ウ', 'UW1': 'ウー', 'UW2': 'ウー'
};

export function arpabetToKatakana(arpabetString) {
    if (!arpabetString) return null;

    // ARPABET comes like "AD0 V AE1 N S M AH0 N T"
    const tokens = arpabetString.split(' ');
    let result = '';

    tokens.forEach(token => {
        // Strip stress numbers for simple mapping if exact definition missing,
        // but we handled stress in map keys for vowels.
        // For consonants, it's just the letter.

        // Special rules could be added here (e.g. T+R -> トラ vs タラ)
        // BUT for "readable enough", direct mapping is often passable as a start.

        if (arpabetToKatakanaMap[token]) {
            result += arpabetToKatakanaMap[token];
        } else {
            // Try without stress digit
            const base = token.replace(/[0-9]/g, '');
            if (arpabetToKatakanaMap[base]) {
                result += arpabetToKatakanaMap[base];
            }
        }
    });

    return result;
}
