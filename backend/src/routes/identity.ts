import express from 'express';
import { body, validationResult } from 'express-validator';
import { IdentityService } from '../services/identityService';
import { authMiddleware } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = express.Router();
const identityService = new IdentityService();

// Create new identity
router.post('/create', [
  authMiddleware,
  body('dataHash').notEmpty().withMessage('Data hash is required'),
  body('documentType').isIn(['passport', 'id_card', 'drivers_license']).withMessage('Invalid document type'),
], async (req: express.Request, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { dataHash, documentType, metadata } = req.body;
    const userId = req.user.id;

    const identity = await identityService.createIdentity({
      userId,
      dataHash,
      documentType,
      metadata,
    });

    logger.info(`Identity created for user ${userId}`);
    res.status(201).json({
      success: true,
      data: identity,
    });
  } catch (error: any) {
    logger.error('Error creating identity:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
});

// Get user identity
router.get('/user/:userId', authMiddleware, async (req: express.Request, res: express.Response) => {
  try {
    const { userId } = req.params;
    
    // Users can only access their own identity unless they're verifiers
    if (req.user.id !== userId && !req.user.isVerifier) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    const identity = await identityService.getIdentityByUserId(userId);
    
    if (!identity) {
      return res.status(404).json({
        success: false,
        message: 'Identity not found',
      });
    }

    res.json({
      success: true,
      data: identity,
    });
  } catch (error: any) {
    logger.error('Error fetching identity:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
});

// Update identity
router.put('/update/:identityId', [
  authMiddleware,
  body('dataHash').optional().notEmpty().withMessage('Data hash cannot be empty'),
  body('metadata').optional().isObject().withMessage('Metadata must be an object'),
], async (req: express.Request, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { identityId } = req.params;
    const updates = req.body;

    const identity = await identityService.getIdentityById(identityId);
    
    if (!identity) {
      return res.status(404).json({
        success: false,
        message: 'Identity not found',
      });
    }

    // Users can only update their own identity
    if (identity.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    const updatedIdentity = await identityService.updateIdentity(identityId, updates);

    logger.info(`Identity ${identityId} updated by user ${req.user.id}`);
    res.json({
      success: true,
      data: updatedIdentity,
    });
  } catch (error: any) {
    logger.error('Error updating identity:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
});

// Delete identity
router.delete('/:identityId', authMiddleware, async (req: express.Request, res: express.Response) => {
  try {
    const { identityId } = req.params;

    const identity = await identityService.getIdentityById(identityId);
    
    if (!identity) {
      return res.status(404).json({
        success: false,
        message: 'Identity not found',
      });
    }

    // Users can only delete their own identity
    if (identity.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    await identityService.deleteIdentity(identityId);

    logger.info(`Identity ${identityId} deleted by user ${req.user.id}`);
    res.json({
      success: true,
      message: 'Identity deleted successfully',
    });
  } catch (error: any) {
    logger.error('Error deleting identity:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
});

// Get identity verification status
router.get('/verification-status/:identityId', authMiddleware, async (req: express.Request, res: express.Response) => {
  try {
    const { identityId } = req.params;

    const identity = await identityService.getIdentityById(identityId);
    
    if (!identity) {
      return res.status(404).json({
        success: false,
        message: 'Identity not found',
      });
    }

    // Users can only check their own identity status
    if (identity.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    const verificationStatus = await identityService.getVerificationStatus(identityId);

    res.json({
      success: true,
      data: verificationStatus,
    });
  } catch (error: any) {
    logger.error('Error fetching verification status:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
});

export default router;
