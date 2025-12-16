/**
 * Testes Unitários - Validadores
 */

const {
  validateFlowRequest,
  validateSelectService,
  validateSelectDate,
  validateSelectBarber,
  validateSelectTime,
  validateSubmitDetails,
  validateConfirmBooking,
  validateByActionType
} = require('../validators');

describe('Validadores', () => {
  describe('validateFlowRequest', () => {
    test('deve rejeitar dados null', () => {
      const result = validateFlowRequest(null);
      expect(result.valid).toBe(false);
      expect(result.error).toBeTruthy();
    });

    test('deve rejeitar dados undefined', () => {
      const result = validateFlowRequest(undefined);
      expect(result.valid).toBe(false);
      expect(result.error).toBeTruthy();
    });

    test('deve rejeitar dados que não são objeto', () => {
      const result = validateFlowRequest('string');
      expect(result.valid).toBe(false);
      expect(result.error).toBeTruthy();
    });

    test('deve rejeitar requisição sem action', () => {
      const result = validateFlowRequest({ version: '3.0' });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('action');
    });

    test('deve aceitar requisição válida com INIT', () => {
      const result = validateFlowRequest({ action: 'INIT', version: '3.0' });
      expect(result.valid).toBe(true);
      expect(result.data.action).toBe('INIT');
    });

    test('deve aceitar requisição válida com data_exchange', () => {
      const result = validateFlowRequest({
        action: 'data_exchange',
        version: '3.0',
        data: { action_type: 'SELECT_SERVICE' }
      });
      expect(result.valid).toBe(true);
      expect(result.data.action).toBe('data_exchange');
    });
  });

  describe('validateSelectService', () => {
    test('deve rejeitar payload null', () => {
      const result = validateSelectService(null);
      expect(result.valid).toBe(false);
    });

    test('deve rejeitar sem selected_service', () => {
      const result = validateSelectService({});
      expect(result.valid).toBe(false);
    });

    test('deve rejeitar serviço inválido', () => {
      const result = validateSelectService({ selected_service: 'servico_invalido' });
      expect(result.valid).toBe(false);
    });

    test('deve aceitar serviço válido', () => {
      const result = validateSelectService({ selected_service: 'corte_masculino' });
      expect(result.valid).toBe(true);
      expect(result.data.selected_service).toBe('corte_masculino');
    });
  });

  describe('validateSelectDate', () => {
    test('deve rejeitar sem selected_date', () => {
      const result = validateSelectDate({ selected_service: 'corte_masculino' });
      expect(result.valid).toBe(false);
    });

    test('deve rejeitar formato de data inválido', () => {
      const result = validateSelectDate({ 
        selected_service: 'corte_masculino',
        selected_date: '2025/12/19' 
      });
      expect(result.valid).toBe(false);
    });

    test('deve aceitar data válida (YYYY-MM-DD)', () => {
      const result = validateSelectDate({ 
        selected_service: 'corte_masculino',
        selected_date: '2025-12-19' 
      });
      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.data.selected_date).toBe('2025-12-19');
      }
    });
  });

  describe('validateSelectBarber', () => {
    test('deve rejeitar sem selected_barber', () => {
      const result = validateSelectBarber({});
      expect(result.valid).toBe(false);
    });

    test('deve rejeitar barbeiro inválido', () => {
      const result = validateSelectBarber({ selected_barber: 'barbeiro_invalido' });
      expect(result.valid).toBe(false);
    });

    test('deve aceitar barbeiro válido', () => {
      const result = validateSelectBarber({ selected_barber: 'joao' });
      // Pode usar schema Zod ou validação manual
      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.data.selected_barber).toBe('joao');
      }
    });
  });

  describe('validateSelectTime', () => {
    test('deve rejeitar sem selected_time', () => {
      const result = validateSelectTime({
        selected_service: 'corte_masculino',
        selected_date: '2025-12-19',
        selected_barber: 'joao'
      });
      expect(result.valid).toBe(false);
    });

    test('deve rejeitar formato de horário inválido', () => {
      const result = validateSelectTime({
        selected_service: 'corte_masculino',
        selected_date: '2025-12-19',
        selected_barber: 'joao',
        selected_time: '9:00'
      });
      expect(result.valid).toBe(false);
    });

    test('deve aceitar horário válido (HH:MM)', () => {
      const result = validateSelectTime({
        selected_service: 'corte_masculino',
        selected_date: '2025-12-19',
        selected_barber: 'joao',
        selected_time: '09:00'
      });
      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.data.selected_time).toBe('09:00');
      }
    });
  });

  describe('validateSubmitDetails', () => {
    test('deve rejeitar sem client_name', () => {
      const result = validateSubmitDetails({ client_phone: '11999999999' });
      expect(result.valid).toBe(false);
    });

    test('deve rejeitar sem client_phone', () => {
      const result = validateSubmitDetails({ client_name: 'João' });
      expect(result.valid).toBe(false);
    });

    test('deve rejeitar telefone inválido', () => {
      const result = validateSubmitDetails({
        client_name: 'João',
        client_phone: '123'
      });
      expect(result.valid).toBe(false);
    });

    test('deve rejeitar email inválido', () => {
      const result = validateSubmitDetails({
        client_name: 'João',
        client_phone: '11999999999',
        client_email: 'email-invalido'
      });
      expect(result.valid).toBe(false);
    });

    test('deve aceitar dados válidos', () => {
      const result = validateSubmitDetails({
        selected_service: 'corte_masculino',
        selected_date: '2025-12-19',
        selected_barber: 'joao',
        selected_time: '09:00',
        client_name: 'João Silva',
        client_phone: '(11) 99999-9999',
        client_email: 'joao@example.com'
      });
      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.data.client_name).toBe('João Silva');
        expect(result.data.client_phone).toBe('11999999999'); // Normalizado
      }
    });

    test('deve normalizar telefone (remove caracteres não numéricos)', () => {
      const result = validateSubmitDetails({
        selected_service: 'corte_masculino',
        selected_date: '2025-12-19',
        selected_barber: 'joao',
        selected_time: '09:00',
        client_name: 'João',
        client_phone: '(11) 99999-9999'
      });
      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.data.client_phone).toBe('11999999999');
      }
    });

    test('deve fazer trim nos campos de texto', () => {
      const result = validateSubmitDetails({
        selected_service: 'corte_masculino',
        selected_date: '2025-12-19',
        selected_barber: 'joao',
        selected_time: '09:00',
        client_name: '  João Silva  ',
        client_phone: '11999999999'
      });
      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.data.client_name).toBe('João Silva');
      }
    });
  });

  describe('validateConfirmBooking', () => {
    test('deve rejeitar sem booking_id', () => {
      const result = validateConfirmBooking({});
      expect(result.valid).toBe(false);
    });

    test('deve rejeitar booking_id com formato inválido', () => {
      const result = validateConfirmBooking({ booking_id: 'INVALID-123' });
      expect(result.valid).toBe(false);
    });

    test('deve aceitar booking_id válido (AGD-XXXXXX)', () => {
      const result = validateConfirmBooking({ booking_id: 'AGD-123456' });
      expect(result.valid).toBe(true);
      expect(result.data.booking_id).toBe('AGD-123456');
    });
  });

  describe('validateByActionType', () => {
    test('deve validar SELECT_SERVICE corretamente', () => {
      const result = validateByActionType('SELECT_SERVICE', { selected_service: 'corte_masculino' });
      expect(result.valid).toBe(true);
    });

    test('deve validar SELECT_DATE corretamente', () => {
      const result = validateByActionType('SELECT_DATE', { selected_date: '2025-12-19' });
      expect(result.valid).toBe(true);
    });

    test('deve validar action_type desconhecido', () => {
      const result = validateByActionType('UNKNOWN_ACTION', { some_field: 'value' });
      expect(result.valid).toBe(true); // Aceita se payload é objeto válido
    });
  });
});

