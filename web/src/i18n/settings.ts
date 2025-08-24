export const fallbackLng = 'en'
export const languages = [fallbackLng, 'zh-CN']
export const defaultNS = 'common'
export const ns = ['common', 'layout', 'home', 'components', 'errors']

export function getOptions (lng = fallbackLng, _ns: string | string[] = defaultNS) {
  return {
    // debug: true,
    supportedLngs: languages,
    fallbackLng,
    lng,
    fallbackNS: defaultNS,
    defaultNS,
    ns: _ns
  }
}