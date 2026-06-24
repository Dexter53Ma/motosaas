'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type Locale = 'fr' | 'ar'

interface I18nContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string) => string
  dir: 'ltr' | 'rtl'
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

const translations: Record<Locale, Record<string, string>> = {
  fr: {
    // Navigation
    'nav.dashboard': 'Tableau de bord',
    'nav.vehicles': 'Véhicules',
    'nav.customers': 'Clients',
    'nav.rentals': 'Locations',
    'nav.payments': 'Paiements',
    'nav.reports': 'Rapports',
    'nav.settings': 'Paramètres',
    'nav.whatsapp': 'WhatsApp',
    'nav.reminders': 'Rappels',
    'nav.admin': 'Admin',
    'nav.logout': 'Déconnexion',
    'nav.back': 'Retour',

    // Dashboard
    'dashboard.welcome': 'Bienvenue',
    'dashboard.total_vehicles': 'Total Véhicules',
    'dashboard.active_rentals': 'Locations Actives',
    'dashboard.outstanding': 'Impayés',
    'dashboard.customers': 'Clients',
    'dashboard.quick_actions': 'Actions Rapides',
    'dashboard.add_vehicle': 'Ajouter Véhicule',
    'dashboard.new_rental': 'Nouvelle Location',
    'dashboard.add_customer': 'Ajouter Client',
    'dashboard.record_payment': 'Enregistrer Paiement',

    // Vehicles
    'vehicles.title': 'Véhicules',
    'vehicles.add': 'Ajouter Véhicule',
    'vehicles.search': 'Rechercher...',
    'vehicles.make': 'Marque',
    'vehicles.model': 'Modèle',
    'vehicles.year': 'Année',
    'vehicles.plate': 'Plaque',
    'vehicles.status': 'Statut',
    'vehicles.available': 'Disponible',
    'vehicles.rented': 'Loué',
    'vehicles.maintenance': 'Maintenance',
    'vehicles.daily_rate': 'Tarif Journalier',
    'vehicles.weekly_rate': 'Tarif Hebdomadaire',
    'vehicles.monthly_rate': 'Tarif Mensuel',

    // Customers
    'customers.title': 'Clients',
    'customers.add': 'Ajouter Client',
    'customers.search': 'Rechercher...',
    'customers.name': 'Nom',
    'customers.phone': 'Téléphone',
    'customers.email': 'Email',
    'customers.id_number': 'Numéro ID',
    'customers.rental_history': 'Historique des Locations',
    'customers.notes': 'Notes Internes',

    // Rentals
    'rentals.title': 'Locations',
    'rentals.add': 'Nouvelle Location',
    'rentals.search': 'Rechercher...',
    'rentals.customer': 'Client',
    'rentals.vehicle': 'Véhicule',
    'rentals.start_date': 'Date de Début',
    'rentals.end_date': 'Date de Fin',
    'rentals.daily_rate': 'Tarif Journalier',
    'rentals.total': 'Total',
    'rentals.status': 'Statut',
    'rentals.active': 'Active',
    'rentals.completed': 'Terminée',
    'rentals.overdue': 'En Retard',
    'rentals.checkout': 'Sortie',
    'rentals.return': 'Retour',

    // Payments
    'payments.title': 'Paiements',
    'payments.add': 'Enregistrer Paiement',
    'payments.amount': 'Montant',
    'payments.method': 'Méthode',
    'payments.cash': 'Espèces',
    'payments.card': 'Carte',
    'payments.bank_transfer': 'Virement',
    'payments.mobile_money': 'Mobile Money',
    'payments.reference': 'Référence',
    'payments.date': 'Date',
    'payments.total_revenue': 'Revenu Total',
    'payments.today': "Aujourd'hui",
    'payments.this_month': 'Ce Mois',

    // Reports
    'reports.title': 'Rapports & Analyses',
    'reports.revenue': 'Revenus',
    'reports.vehicles': 'Utilisation Véhicules',
    'reports.customers': 'Analyse Clients',
    'reports.rentals': 'Statistiques Locations',
    'reports.export': 'Exporter CSV',
    'reports.filter': 'Filtrer',

    // Settings
    'settings.title': 'Paramètres',
    'settings.shop': 'Boutique',
    'settings.shop_name': 'Nom de la Boutique',
    'settings.address': 'Adresse',
    'settings.phone': 'Téléphone',
    'settings.email': 'Email',
    'settings.tax_id': 'Numéro Fiscal',
    'settings.rc_number': 'Numéro RC',
    'settings.save': 'Enregistrer',
    'settings.language': 'Langue',

    // Common
    'common.loading': 'Chargement...',
    'common.error': 'Erreur',
    'common.success': 'Succès',
    'common.cancel': 'Annuler',
    'common.delete': 'Supprimer',
    'common.edit': 'Modifier',
    'common.save': 'Enregistrer',
    'common.search': 'Rechercher',
    'common.filter': 'Filtrer',
    'common.all': 'Tous',
    'common.none': 'Aucun',
    'common.yes': 'Oui',
    'common.no': 'Non',
    'common.confirm': 'Confirmer',
    'common.back': 'Retour',
    'common.next': 'Suivant',
    'common.previous': 'Précédent',
    'common.view_all': 'Voir Tout',
    'common.actions': 'Actions',

    // Auth
    'auth.login': 'Connexion',
    'auth.signup': 'Inscription',
    'auth.email': 'Email',
    'auth.password': 'Mot de Passe',
    'auth.forgot_password': 'Mot de Passe Oublié?',
    'auth.no_account': "Pas de compte?",
    'auth.has_account': 'Déjà un compte?',

    // Onboarding
    'onboarding.welcome': 'Bienvenue sur MotoRent',
    'onboarding.step1': 'Informations Boutique',
    'onboarding.step2': 'Détails Véhicules',
    'onboarding.step3': 'Finalisation',
    'onboarding.shop_name': 'Nom de la Boutique',
    'onboarding.shop_address': 'Adresse',
    'onboarding.shop_phone': 'Téléphone',
    'onboarding.shop_email': 'Email',
    'onboarding.finish': 'Terminer',
  },
  ar: {
    // Navigation
    'nav.dashboard': 'لوحة التحكم',
    'nav.vehicles': 'المركبات',
    'nav.customers': 'العملاء',
    'nav.rentals': 'الإيجارات',
    'nav.payments': 'المدفوعات',
    'nav.reports': 'التقارير',
    'nav.settings': 'الإعدادات',
    'nav.whatsapp': 'واتساب',
    'nav.reminders': 'التذكيرات',
    'nav.admin': 'الإدارة',
    'nav.logout': 'تسجيل خروج',
    'nav.back': 'رجوع',

    // Dashboard
    'dashboard.welcome': 'مرحباً',
    'dashboard.total_vehicles': 'إجمالي المركبات',
    'dashboard.active_rentals': 'الإيجارات النشطة',
    'dashboard.outstanding': 'المبالغ المستحقة',
    'dashboard.customers': 'العملاء',
    'dashboard.quick_actions': 'إجراءات سريعة',
    'dashboard.add_vehicle': 'إضافة مركبة',
    'dashboard.new_rental': 'إيجار جديد',
    'dashboard.add_customer': 'إضافة عميل',
    'dashboard.record_payment': 'تسجيل دفعة',

    // Vehicles
    'vehicles.title': 'المركبات',
    'vehicles.add': 'إضافة مركبة',
    'vehicles.search': 'بحث...',
    'vehicles.make': 'العلامة التجارية',
    'vehicles.model': 'الطراز',
    'vehicles.year': 'السنة',
    'vehicles.plate': 'رقم اللوحة',
    'vehicles.status': 'الحالة',
    'vehicles.available': 'متاح',
    'vehicles.rented': 'مؤجر',
    'vehicles.maintenance': 'صيانة',
    'vehicles.daily_rate': 'السعر اليومي',
    'vehicles.weekly_rate': 'السعر الأسبوعي',
    'vehicles.monthly_rate': 'السعر الشهري',

    // Customers
    'customers.title': 'العملاء',
    'customers.add': 'إضافة عميل',
    'customers.search': 'بحث...',
    'customers.name': 'الاسم',
    'customers.phone': 'الهاتف',
    'customers.email': 'البريد الإلكتروني',
    'customers.id_number': 'رقم الهوية',
    'customers.rental_history': 'سجل الإيجارات',
    'customers.notes': 'ملاحظات داخلية',

    // Rentals
    'rentals.title': 'الإيجارات',
    'rentals.add': 'إيجار جديد',
    'rentals.search': 'بحث...',
    'rentals.customer': 'العميل',
    'rentals.vehicle': 'المركبة',
    'rentals.start_date': 'تاريخ البداية',
    'rentals.end_date': 'تاريخ النهاية',
    'rentals.daily_rate': 'السعر اليومي',
    'rentals.total': 'الإجمالي',
    'rentals.status': 'الحالة',
    'rentals.active': 'نشط',
    'rentals.completed': 'مكتمل',
    'rentals.overdue': 'متأخر',
    'rentals.checkout': 'خروج',
    'rentals.return': 'إعادة',

    // Payments
    'payments.title': 'المدفوعات',
    'payments.add': 'تسجيل دفعة',
    'payments.amount': 'المبلغ',
    'payments.method': 'الطريقة',
    'payments.cash': 'نقدي',
    'payments.card': 'بطاقة',
    'payments.bank_transfer': 'تحويل بنكي',
    'payments.mobile_money': 'محفظة إلكترونية',
    'payments.reference': 'المرجع',
    'payments.date': 'التاريخ',
    'payments.total_revenue': 'إجمالي الإيرادات',
    'payments.today': 'اليوم',
    'payments.this_month': 'هذا الشهر',

    // Reports
    'reports.title': 'التقارير والتحليلات',
    'reports.revenue': 'الإيرادات',
    'reports.vehicles': 'استخدام المركبات',
    'reports.customers': 'تحليل العملاء',
    'reports.rentals': 'إحصائيات الإيجارات',
    'reports.export': 'تصدير CSV',
    'reports.filter': 'تصفية',

    // Settings
    'settings.title': 'الإعدادات',
    'settings.shop': 'المتجر',
    'settings.shop_name': 'اسم المتجر',
    'settings.address': 'العنوان',
    'settings.phone': 'الهاتف',
    'settings.email': 'البريد الإلكتروني',
    'settings.tax_id': 'الرقم الضريبي',
    'settings.rc_number': 'رقم السجل التجاري',
    'settings.save': 'حفظ',
    'settings.language': 'اللغة',

    // Common
    'common.loading': 'جاري التحميل...',
    'common.error': 'خطأ',
    'common.success': 'نجاح',
    'common.cancel': 'إلغاء',
    'common.delete': 'حذف',
    'common.edit': 'تعديل',
    'common.save': 'حفظ',
    'common.search': 'بحث',
    'common.filter': 'تصفية',
    'common.all': 'الكل',
    'common.none': 'لا شيء',
    'common.yes': 'نعم',
    'common.no': 'لا',
    'common.confirm': 'تأكيد',
    'common.back': 'رجوع',
    'common.next': 'التالي',
    'common.previous': 'السابق',
    'common.view_all': 'عرض الكل',
    'common.actions': 'الإجراءات',

    // Auth
    'auth.login': 'تسجيل دخول',
    'auth.signup': 'إنشاء حساب',
    'auth.email': 'البريد الإلكتروني',
    'auth.password': 'كلمة المرور',
    'auth.forgot_password': 'نسيت كلمة المرور؟',
    'auth.no_account': 'ليس لديك حساب؟',
    'auth.has_account': 'لديك حساب بالفعل؟',

    // Onboarding
    'onboarding.welcome': 'مرحباً بك في MotoRent',
    'onboarding.step1': 'معلومات المتجر',
    'onboarding.step2': 'تفاصيل المركبات',
    'onboarding.step3': 'الإتمام',
    'onboarding.shop_name': 'اسم المتجر',
    'onboarding.shop_address': 'عنوان المتجر',
    'onboarding.shop_phone': 'هاتف المتجر',
    'onboarding.shop_email': 'بريد المتجر الإلكتروني',
    'onboarding.finish': 'إنهاء',
  },
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('fr')

  useEffect(() => {
    const saved = localStorage.getItem('locale') as Locale
    if (saved && (saved === 'fr' || saved === 'ar')) {
      setLocaleState(saved)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('locale', locale)
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.lang = locale
  }, [locale])

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale)
  }

  const t = (key: string): string => {
    return translations[locale][key] || key
  }

  const dir = locale === 'ar' ? 'rtl' : 'ltr'

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, dir }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider')
  }
  return context
}

export function formatDate(date: Date | string, locale: Locale = 'fr'): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString(locale === 'ar' ? 'ar-MA' : 'fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function formatCurrency(amount: number, locale: Locale = 'fr'): string {
  return new Intl.NumberFormat(locale === 'ar' ? 'ar-MA' : 'fr-MA', {
    style: 'decimal',
    minimumFractionDigits: 2,
  }).format(amount) + ' MAD'
}

export function formatNumber(num: number, locale: Locale = 'fr'): string {
  return new Intl.NumberFormat(locale === 'ar' ? 'ar-MA' : 'fr-MA').format(num)
}