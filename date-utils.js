// ============================================
// UTILIDADES DE FECHA - ZONA HORARIA CARACAS
// ============================================

const DateUtils = {
    TIMEZONE: 'America/Caracas',
    LOCALE: 'es-VE',

    // Formatear fecha: DD/MM/AAAA
    formatDate(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return new Intl.DateTimeFormat(this.LOCALE, {
            timeZone: this.TIMEZONE,
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        }).format(date);
    },

    // Formatear fecha y hora: DD/MM/AAAA HH:MM
    formatDateTime(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return new Intl.DateTimeFormat(this.LOCALE, {
            timeZone: this.TIMEZONE,
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        }).format(date);
    },

    // Formatear fecha larga: "13 de julio de 2026"
    formatDateLong(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return new Intl.DateTimeFormat(this.LOCALE, {
            timeZone: this.TIMEZONE,
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        }).format(date);
    },

    // Formatear solo hora: HH:MM
    formatTime(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return new Intl.DateTimeFormat(this.LOCALE, {
            timeZone: this.TIMEZONE,
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        }).format(date);
    },

    // Obtener fecha actual en Caracas como string YYYY-MM-DD (para inputs)
    getCurrentDateInput() {
        const now = new Date();
        const caracasDate = new Intl.DateTimeFormat('en-CA', {
            timeZone: this.TIMEZONE,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).format(now);
        return caracasDate;
    },

    // Obtener fecha/hora actual en Caracas
    getCurrentCaracasDate() {
        return new Date();
    },

    // Obtener inicio del día en Caracas (00:00:00)
    getStartOfDay(dateString) {
        const date = new Date(dateString);
        const caracasDate = new Intl.DateTimeFormat('en-CA', {
            timeZone: this.TIMEZONE,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).format(date);
        return `${caracasDate}T00:00:00`;
    },

    // Obtener fin del día en Caracas (23:59:59)
    getEndOfDay(dateString) {
        const date = new Date(dateString);
        const caracasDate = new Intl.DateTimeFormat('en-CA', {
            timeZone: this.TIMEZONE,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).format(date);
        return `${caracasDate}T23:59:59`;
    },

    // Verificar si una fecha es hoy en Caracas
    isToday(dateString) {
        if (!dateString) return false;
        const today = this.getCurrentDateInput();
        const date = new Intl.DateTimeFormat('en-CA', {
            timeZone: this.TIMEZONE,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).format(new Date(dateString));
        return date === today;
    },

    // Verificar si una fecha es de este mes en Caracas
    isThisMonth(dateString) {
        if (!dateString) return false;
        const now = new Date();
        const caracasNow = new Intl.DateTimeFormat('en-CA', {
            timeZone: this.TIMEZONE,
            year: 'numeric',
            month: '2-digit'
        }).format(now);

        const date = new Intl.DateTimeFormat('en-CA', {
            timeZone: this.TIMEZONE,
            year: 'numeric',
            month: '2-digit'
        }).format(new Date(dateString));

        return date === caracasNow;
    },

    // Calcular días transcurridos desde una fecha (en Caracas)
    daysSince(dateString) {
        if (!dateString) return 0;
        const today = new Date();
        const target = new Date(dateString);

        const todayCaracas = new Intl.DateTimeFormat('en-CA', {
            timeZone: this.TIMEZONE,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).format(today);

        const targetCaracas = new Intl.DateTimeFormat('en-CA', {
            timeZone: this.TIMEZONE,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).format(target);

        const diffTime = new Date(todayCaracas) - new Date(targetCaracas);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    },

    // Formatear para mostrar en reportes con zona horaria
    formatForReport(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return new Intl.DateTimeFormat(this.LOCALE, {
            timeZone: this.TIMEZONE,
            weekday: 'long',
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        }).format(date);
    }
};

// Hacer disponible globalmente
if (typeof window !== 'undefined') {
    window.DateUtils = DateUtils;
}