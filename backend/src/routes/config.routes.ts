import { Router } from 'express';
import type { Request, Response } from 'express';
import type { ManifestResponse } from '../../../shared/types';
import { authMiddleware } from '../middleware/auth.middleware';
import { ManifestService } from '../services/manifest.service';
import { JwtService } from '../services/jwt.service';
import { logger } from '../utils/logger';
import type { AuthenticatedRequest } from '../types';

const router = Router();
const jwtService = new JwtService();
const manifestService = new ManifestService();

router.post(
  '/api/config/remotes',
  authMiddleware(jwtService),
  (req: Request, res: Response) => {
    const start = Date.now();
    const { user } = req as AuthenticatedRequest;

    if (!user.roles || user.roles.length === 0) {
      logger.warn('manifest_request_denied', {
        reason: 'insufficient_permissions',
        userId: user.sub,
        path: req.path,
      });
      return res.status(403).json({
        error: 'insufficient_permissions',
        error_description: 'User has no valid roles assigned',
        code: 'INSUFFICIENT_PERMISSIONS',
      });
    }

    const authorizedRemotes = manifestService.getAuthorizedRemotes(user.roles);
    if (authorizedRemotes.length === 0) {
      logger.warn('manifest_request_denied', {
        reason: 'no_authorized_remotes',
        userId: user.sub,
        path: req.path,
      });
      return res.status(403).json({
        error: 'insufficient_permissions',
        error_description: 'User has no valid roles assigned',
        code: 'INSUFFICIENT_PERMISSIONS',
      });
    }

    const remotes = authorizedRemotes.map(({ enabled, ...remote }) => remote);

    const response: ManifestResponse = {
      remotes,
      user,
    };

    logger.info('manifest_request', {
      userId: user.sub,
      roles: user.roles,
      remotesCount: remotes.length,
      duration_ms: Date.now() - start,
    });

    return res.status(200).json(response);
  }
);

export const configRoutes = router;
