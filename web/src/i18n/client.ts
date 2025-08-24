'use client'

import i18next, { i18n } from 'i18next'
import { initReactI18next, useTranslation as useTranslationOrg } from 'react-i18next'
import resourcesToBackend from 'i18next-resources-to-backend'
import { getOptions } from './settings'

// on client side the normal singleton is ok
i18next
  .use(initReactI18next)
  .use(resourcesToBackend((language: string, namespace: string) => import(`../../public/locales/${language}/${namespace}.json`)))
  .init({
    ...getOptions(),
    lng: undefined, // let detect the language on client side
    ns: ['common', 'layout', 'home'], // 指定客户端需要加载的所有命名空间
    detection: {
      order: ['path', 'htmlTag', 'cookie', 'navigator'],
    }
  })

export function useTranslation(lng: string, ns?: string | string[], options?: {}) {
  if (i18next.resolvedLanguage !== lng) {
    i18next.changeLanguage(lng)
  }
  return useTranslationOrg(ns, options)
}