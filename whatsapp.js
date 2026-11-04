// МОДУЛЬ БЕЗОПАСНОСТИ WHATSAPP (ОФИЦИАЛЬНЫЙ GREEN-API SDK)
const greenAPI = require('@green-api/whatsapp-api-client');

// 1. Подключаем ваши настоящие полные ключи от GREEN-API
const whatsapp = greenAPI.restAPI({ 
    idInstance: "720122701964", // Ваш точный полный ID инстанса
    apiTokenInstance: "4dbc1de82d9644818689546653254a8e16b22c98fc1948d5b8" // Ваш приватный токен
}); 

/**
 * Универсальная функция: принимает имя и код, формирует текст и шлет владельцу в WhatsApp
 * @param {string} userName - Имя профиля
 * @param {string} generatedCode - 5-значный код безопасности
 * @returns {Promise<boolean>} - Успешность доставки сообщения
 */
async function sendVerificationMessage(userName, generatedCode) {
    try {
        const myPhoneNumber = "79804127991"; // Ваш номер телефона владельца KamchyAI
        const messageText = `🚨 *KamchyAI Security*\n\nПользователь "${userName}" запрашивает доступ к ИИ-ядру Google Flow.\n\nКод верификации терминала: *${generatedCode}*`;

        console.log(`⏳ [WhatsApp SDK]: Отправка уведомления на номер ${myPhoneNumber}...`); 

        // Отправляем сообщение через официальный метод SDK библиотеки
        const response = await whatsapp.message.sendMessage( 
            `${myPhoneNumber}@c.us`, 
            null, 
            messageText 
        ); 

        console.log("✅ [WhatsApp SDK]: Сообщение успешно доставлено тебе на телефон!", response); 
        return true;
    } catch (error) { 
        console.error("❌ [WhatsApp SDK] Ошибка при отправке сообщения:", error.message); 
        return false;
    } 
}

// Экспортируем функцию для подключения к главному ядру server.js
module.exports = {
    sendVerificationMessage
};
