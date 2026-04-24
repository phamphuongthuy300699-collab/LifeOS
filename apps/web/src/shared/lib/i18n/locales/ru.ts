/**
 * Russian translations — UI chrome, navigation, common labels.
 * Content (card data, contact names, etc.) is user-generated, not translated.
 */
const ru = {
  // ── Navigation ──
  nav: {
    today: 'Сегодня',
    inbox: 'Входящие',
    workout: 'Тренировка',
    nutrition: 'Питание',
    more: 'Ещё',
  },

  // ── More menu ──
  more: {
    learning: 'Обучение',
    contacts: 'Контакты',
    projects: 'Проекты',
    finance: 'Финансы',
    export: 'Экспорт',
    settings: 'Настройки',
  },

  // ── Common actions ──
  actions: {
    add: 'Добавить',
    save: 'Сохранить',
    cancel: 'Отмена',
    delete: 'Удалить',
    edit: 'Редактировать',
    search: 'Поиск',
    filter: 'Фильтр',
    sort: 'Сортировка',
    done: 'Готово',
    archive: 'Архивировать',
    back: 'Назад',
    confirm: 'Подтвердить',
    reject: 'Отклонить',
    retry: 'Повторить',
    close: 'Закрыть',
    start: 'Начать',
    finish: 'Завершить',
    skip: 'Пропустить',
  },

  // ── Auth ──
  auth: {
    login: 'Войти',
    logout: 'Выйти',
    signInWithGoogle: 'Войти через Google',
    email: 'Email',
    password: 'Пароль',
    forgotPassword: 'Забыли пароль?',
  },

  // ── Today screen ──
  today: {
    title: 'Сегодня',
    focusBlock: 'Фокус дня',
    topTasks: 'Главные задачи',
    events: 'События',
    emailsRequiringAction: 'Письма к действию',
    workoutCard: 'Тренировка',
    nutritionSummary: 'Питание',
    eveningSuggestions: 'Вечерний блок',
    dayReview: 'Обзор дня',
  },

  // ── Inbox ──
  inbox: {
    title: 'Входящие',
    empty: 'Нет новых входящих',
    quickAdd: 'Быстрый захват',
    voiceCapture: 'Голосовой захват',
    triage: 'Определить тип',
    triageActions: {
      task: 'Задача',
      note: 'Заметка',
      event: 'Событие',
      meal: 'Приём пищи',
      expense: 'Расход',
      contact: 'Контакт',
      ignore: 'Игнорировать',
    },
  },

  // ── Tasks ──
  tasks: {
    title: 'Задачи',
    newTask: 'Новая задача',
    status: {
      inbox: 'Входящие',
      todo: 'К выполнению',
      in_progress: 'В работе',
      waiting: 'Ожидание',
      done: 'Выполнена',
      cancelled: 'Отменена',
    },
    priority: {
      urgent: 'Срочно',
      high: 'Высокий',
      medium: 'Средний',
      low: 'Низкий',
      none: 'Без приоритета',
    },
    fields: {
      title: 'Название',
      description: 'Описание',
      dueDate: 'Срок',
      project: 'Проект',
      priority: 'Приоритет',
    },
  },

  // ── Notes ──
  notes: {
    title: 'Заметки',
    newNote: 'Новая заметка',
    untitled: 'Без названия',
  },

  // ── Calendar ──
  calendar: {
    title: 'Календарь',
    newEvent: 'Новое событие',
    allDay: 'Весь день',
    noEvents: 'Нет событий',
  },

  // ── Mail ──
  mail: {
    title: 'Почта',
    threads: 'Темы',
    createTask: 'Создать задачу из письма',
    markProcessed: 'Обработано',
    noMail: 'Нет писем',
  },

  // ── Workouts ──
  workout: {
    title: 'Тренировка',
    plans: 'Планы тренировок',
    exercises: 'Упражнения',
    startWorkout: 'Начать тренировку',
    finishWorkout: 'Завершить тренировку',
    addSet: 'Добавить подход',
    set: 'Подход',
    weight: 'Вес',
    reps: 'Повторения',
    rest: 'Отдых',
    technique: 'Техника',
    summary: 'Итог тренировки',
    previousResult: 'Прошлый результат',
  },

  // ── Nutrition ──
  nutrition: {
    title: 'Питание',
    dailyGoal: 'Дневная цель',
    consumed: 'Съедено',
    remaining: 'Осталось',
    calories: 'Калории',
    protein: 'Белки',
    fat: 'Жиры',
    carbs: 'Углеводы',
    addMeal: 'Добавить приём пищи',
    mealType: {
      breakfast: 'Завтрак',
      lunch: 'Обед',
      dinner: 'Ужин',
      snack: 'Перекус',
      pre_workout: 'До тренировки',
      post_workout: 'После тренировки',
    },
  },

  // ── Learning ──
  learning: {
    title: 'Обучение',
    tracks: 'Треки',
    materials: 'Материалы',
    startSession: 'Начать сессию',
    progress: 'Прогресс',
  },

  // ── Contacts ──
  contacts: {
    title: 'Контакты',
    newContact: 'Новый контакт',
  },

  // ── Projects ──
  projects: {
    title: 'Проекты',
    newProject: 'Новый проект',
    nextAction: 'Следующее действие',
    milestone: 'Веха',
    status: {
      idea: 'Идея',
      active: 'Активный',
      paused: 'На паузе',
      completed: 'Завершён',
      archived: 'В архиве',
    },
  },

  // ── Finance ──
  finance: {
    title: 'Финансы',
    income: 'Доход',
    expense: 'Расход',
    addTransaction: 'Добавить операцию',
    summary: 'Сводка',
  },

  // ── Export ──
  export: {
    title: 'Экспорт',
    startExport: 'Начать экспорт',
    format: {
      json: 'JSON',
      csv: 'CSV',
      markdown: 'Markdown',
    },
  },

  // ── Settings ──
  settings: {
    title: 'Настройки',
    profile: 'Профиль',
    theme: 'Тема',
    language: 'Язык',
    themes: {
      light: 'Светлая',
      dark: 'Тёмная',
      system: 'Системная',
    },
  },

  // ── Common ──
  common: {
    loading: 'Загрузка...',
    error: 'Ошибка',
    noData: 'Нет данных',
    offline: 'Нет связи — данные сохранены локально',
    savedLocally: 'Сохранено локально',
    synced: 'Синхронизировано',
  },
} as const;

export default ru;
