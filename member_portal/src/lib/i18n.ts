import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from '@/locales/en.json'
import am from '@/locales/am.json'

i18n.use(initReactI18next).init({
    resources: {
        en: { translation: en },
        am: { translation: am },
    },
    lng: localStorage.getItem('language') || 'en',
    fallbackLng: 'en',
    interpolation: {
        escapeValue: false,
    },
})

// Compatibility translation for legacy static labels that have not yet been
// converted to t('...'). API/database values are intentionally not translated.
const extraAmharic: Record<string, string> = {
    'Site': 'ሳይት', 'Incidents': 'ክስተቶች', 'Site Attendance': 'የሳይት መገኘት',
    'Manage today’s scheduled employees': 'የዛሬ የታቀዱ ሠራተኞችን ያስተዳድሩ',
    'Could not load assigned sites': 'የተመደቡ ሳይቶችን መጫን አልተቻለም',
    'Could not load attendance': 'የመገኘት መረጃን መጫን አልተቻለም',
    'Reason is required. Describe the rule violation:': 'ምክንያት ያስፈልጋል። የደንብ ጥሰቱን ይግለጹ፦',
    'Optional attendance note': 'አማራጭ የመገኘት ማስታወሻ',
    'A reason is required for a policy violation': 'ለደንብ ጥሰት ምክንያት ያስፈልጋል',
    'Attendance could not be saved': 'የመገኘት መረጃውን ማስቀመጥ አልተቻለም',
    'No sites are assigned to your account.': 'ለመለያዎ የተመደበ ሳይት የለም።',
    'Assigned site': 'የተመደበ ሳይት', 'scheduled': 'የታቀዱ',
    'No employees are scheduled at this site today.': 'ዛሬ በዚህ ሳይት የታቀደ ሠራተኛ የለም።',
    'Current': 'አሁን', 'Present': 'ተገኝቷል', 'Late': 'ዘግይቷል',
    'Late (permission)': 'በፈቃድ ዘግይቷል', 'Absent': 'ቀርቷል',
    'Absent (permission)': 'በፈቃድ ቀርቷል', 'Policy violation': 'የደንብ ጥሰት',
    'Report and review your site incidents': 'የሳይትዎን ክስተቶች ይመዝግቡ እና ይመልከቱ',
    'Select site': 'ሳይት ይምረጡ', 'What happened?': 'ምን ተከሰተ?',
    'Submit incident': 'ክስተት አስገባ', 'Incident submitted': 'ክስተቱ ተመዝግቧል',
    'Could not submit incident': 'ክስተቱን ማስገባት አልተቻለም', 'My reports': 'የእኔ ሪፖርቶች',
    'LOW': 'ዝቅተኛ', 'MEDIUM': 'መካከለኛ', 'HIGH': 'ከፍተኛ', 'CRITICAL': 'አስጊ',
    'No attendance records yet': 'እስካሁን የመገኘት መዝገብ የለም',
    'In': 'መግቢያ', 'Out': 'መውጫ', 'Method': 'ዘዴ',
    'English': 'English', 'Amharic': 'አማርኛ', 'Profile': 'መገለጫ', 'Hired': 'የተቀጠረበት',
    'Passwords do not match': 'የይለፍ ቃሎቹ አይመሳሰሉም',
    'Password must be at least 6 characters': 'የይለፍ ቃሉ ቢያንስ 6 ቁምፊዎች ሊኖሩት ይገባል',
    'Password changed successfully': 'የይለፍ ቃሉ ተቀይሯል',
    'Failed to change password': 'የይለፍ ቃሉን መቀየር አልተቻለም',
    'Online': 'በመስመር ላይ', 'Offline': 'ከመስመር ውጭ', 'Syncing...': 'በማመሳሰል ላይ...',
    'Failed': 'አልተሳካም', 'Pending': 'በመጠባበቅ ላይ', 'Dismiss': 'ዝጋ',
    'Sync All': 'ሁሉንም አመሳስል', 'Clear Pending': 'የሚጠባበቁትን ሰርዝ',
    'Clear Failed': 'ያልተሳኩትን ሰርዝ', 'Pending Actions': 'የሚጠባበቁ ድርጊቶች',
    'Failed Actions': 'ያልተሳኩ ድርጊቶች', 'Retries': 'የድጋሚ ሙከራዎች',
    'Clock In': 'መግቢያ', 'Clock Out': 'መውጫ', 'Report Incident': 'ክስተት ሪፖርት አድርግ',
    'Lat': 'ኬክሮስ', 'Lng': 'ኬንትሮስ', 'Missing Google Maps API Key': 'የGoogle Maps API ቁልፍ የለም',
    'Invalid Site Coordinates': 'የሳይቱ መጋጠሚያዎች ትክክል አይደሉም',
    'APPROVED': 'ጸድቋል', 'ETB': 'ብር', 'Loading...': 'በመጫን ላይ...',
    'Show password': 'የይለፍ ቃል አሳይ', 'Hide password': 'የይለፍ ቃል ደብቅ',
    'Remember me': 'አስታውሰኝ', 'Phone Number': 'ስልክ ቁጥር', 'Password': 'የይለፍ ቃል',
    'Login': 'ግባ', 'Schedule': 'መርሃ ግብር', 'History': 'ታሪክ', 'Salary': 'ደመወዝ',
    'Sync': 'ማመሳሰል', 'Home': 'ዋና', 'Emergency Alert': 'የአደጋ ጊዜ ማንቂያ',
    'Refresh GPS': 'GPS አድስ', 'Selfie': 'የራስ ፎቶ', 'Cached': 'ከመሸጎጫ የተገኘ',
    'Demo Accounts': 'የሙከራ መለያዎች', 'Tap to fill': 'ለመሙላት ይንኩ',
    'Phone number is required': 'ስልክ ቁጥር ያስፈልጋል', 'Password is required': 'የይለፍ ቃል ያስፈልጋል',
    'Security Guard': 'የጥበቃ ሠራተኛ', 'Cleaner': 'ጽዳት ሠራተኛ',
    'COMPLETED': 'ተጠናቋል', 'IN PROGRESS': 'በሂደት ላይ', 'SCHEDULED': 'የታቀደ',
    'Personal Information': 'የግል መረጃ', 'Settings': 'ቅንብሮች', 'Language': 'ቋንቋ',
    'Change Password': 'የይለፍ ቃል ቀይር', 'Current Password': 'አሁን ያለው የይለፍ ቃል',
    'New Password': 'አዲስ የይለፍ ቃል', 'Confirm Password': 'የይለፍ ቃል አረጋግጥ',
    'Logout': 'ውጣ', 'Cancel': 'ሰርዝ', 'Save': 'አስቀምጥ',
}

const flattenTranslations = (english: any, amharic: any, output: Record<string, string> = {}) => {
    Object.keys(english).forEach(key => {
        if (typeof english[key] === 'string' && typeof amharic?.[key] === 'string') output[english[key]] = amharic[key]
        else if (english[key] && typeof english[key] === 'object') flattenTranslations(english[key], amharic?.[key], output)
    })
    return output
}
const staticAmharic = { ...flattenTranslations(en, am), ...extraAmharic }
const originalText = new WeakMap<Text, string>()
const originalAttributes = new WeakMap<Element, Map<string, string>>()
const translatedAttributes = ['placeholder', 'title', 'aria-label']

function translateStaticTree(root: Node, language: string) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
    let current: Node | null
    while ((current = walker.nextNode())) {
        const text = current as Text
        const parent = text.parentElement
        if (!parent || parent.closest('[data-i18n-dynamic="true"]') || ['SCRIPT', 'STYLE'].includes(parent.tagName)) continue
        if (!originalText.has(text)) originalText.set(text, text.data)
        const original = originalText.get(text)!
        const trimmed = original.trim()
        if (!trimmed) continue
        let translated = trimmed
        if (language === 'am') {
            translated = staticAmharic[trimmed] || trimmed
            if (translated === trimmed && trimmed.endsWith(':')) translated = `${staticAmharic[trimmed.slice(0, -1)] || trimmed.slice(0, -1)}:`
            if (translated === trimmed) {
                const match = trimmed.match(/^(.+?)\s*\((\d+)\)$/)
                if (match && staticAmharic[match[1]]) translated = `${staticAmharic[match[1]]} (${match[2]})`
            }
        }
        text.data = original.replace(trimmed, translated)
    }
    if (!(root instanceof Element)) return
    for (const element of [root, ...Array.from(root.querySelectorAll('*'))]) {
        if (element.closest('[data-i18n-dynamic="true"]')) continue
        let saved = originalAttributes.get(element)
        if (!saved) { saved = new Map(); originalAttributes.set(element, saved) }
        translatedAttributes.forEach(attribute => {
            const value = element.getAttribute(attribute)
            if (value !== null && !saved!.has(attribute)) saved!.set(attribute, value)
            const original = saved!.get(attribute)
            if (original) element.setAttribute(attribute, language === 'am' ? (staticAmharic[original] || original) : original)
        })
    }
}

if (typeof document !== 'undefined') {
    let applying = false
    const apply = (root: Node = document.body) => {
        if (applying || !document.body) return
        applying = true
        observer.disconnect()
        translateStaticTree(root, i18n.language)
        observer.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: translatedAttributes })
        applying = false
    }
    const observer = new MutationObserver(records => {
        records.forEach(record => {
            if (record.type === 'childList') record.addedNodes.forEach(node => apply(node))
            else {
                if (record.type === 'characterData') originalText.delete(record.target as Text)
                if (record.type === 'attributes' && record.attributeName) originalAttributes.get(record.target as Element)?.delete(record.attributeName)
                apply(record.target)
            }
        })
    })
    const start = () => apply(document.body)
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true })
    else queueMicrotask(start)
    i18n.on('languageChanged', () => apply(document.body))
}

export default i18n
