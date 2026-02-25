import type { Request, Response } from 'express';
import * as service from '../services/credentialsService';
import { HTTP_STATUS, ERROR_MESSAGES, SUCCESS_MESSAGES } from '../constants';

export async function list(req: Request, res: Response): Promise<void> {
  try {
    const data = await service.getAllCredentials();
    res.json({ success: true, data });
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, error: (error as Error).message });
  }
}

export async function get(req: Request, res: Response): Promise<void> {
  try {
    const data = await service.getCredentialByPlatform(req.params.platform as string);
    if (!data) {
      res.status(HTTP_STATUS.NOT_FOUND).json({ success: false, error: ERROR_MESSAGES.CREDENTIALS_NOT_FOUND_PLATFORM });
      return;
    }
    res.json({ success: true, data });
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, error: (error as Error).message });
  }
}

export async function upsert(req: Request, res: Response): Promise<void> {
  try {
    const data = await service.upsertCredential(req.params.platform as string, req.body);
    res.json({ success: true, data, message: SUCCESS_MESSAGES.CREDENTIALS_SAVED });
  } catch (error) {
    const status = (error as { status?: number }).status || HTTP_STATUS.INTERNAL_SERVER_ERROR;
    res.status(status).json({ success: false, error: (error as Error).message });
  }
}

export async function remove(req: Request, res: Response): Promise<void> {
  try {
    await service.deleteCredential(req.params.platform as string);
    res.json({ success: true, message: SUCCESS_MESSAGES.CREDENTIALS_DELETED });
  } catch (error) {
    const status = (error as { status?: number }).status || HTTP_STATUS.INTERNAL_SERVER_ERROR;
    res.status(status).json({ success: false, error: (error as Error).message });
  }
}
