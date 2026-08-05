import API from '../../Api';
import { getRequest } from '../../ApiFunction';

export const getMessageLogs = (params = {}) =>
  getRequest(API.MESSAGE_LOGS, { params }).then((r) => r.data);
