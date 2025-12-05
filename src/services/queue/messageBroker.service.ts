import { MessageBrokerService } from "@/types/queue.js";

class MessageBrokerManagerService {
    private messageBroker: MessageBrokerService | null = null;

    constructor() { }

    setMessageBroker(broker: MessageBrokerService) {
        this.messageBroker = broker;
    }

    getMessageBrokerService(): MessageBrokerService {
        if (!this.messageBroker) {
            throw new Error('MessageBrokerService not initialized yet');
        }
        return this.messageBroker;
    }
}

export const messageBrokerManager = new MessageBrokerManagerService();