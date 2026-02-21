import { Router } from 'express';
import { authenticateToken } from '../auth/auth.middleware';
import {
  addAlly,
  createChallenge,
  getAllies,
  getAlliesTrackers,
  getChallenges,
  getInvitations,
  getSparkFeed,
  markPingsSeen,
  getMyPings,
  joinChallenge,
  respondInvitation,
  searchUsers,
  createSpark,
  voteSpark,
  commentSpark,
  sendInvitation,
  sendPing,
} from './social.controller';
import { createRateLimiter } from '../middleware/rateLimit';

const router = Router();

router.use(authenticateToken);
router.get('/search-users', createRateLimiter(50, 60_000), searchUsers);
router.get('/allies', getAllies);
router.get('/allies/trackers', getAlliesTrackers);
router.post('/allies', createRateLimiter(20, 60_000), addAlly);
router.post('/invites', createRateLimiter(20, 60_000), sendInvitation);
router.get('/invites', getInvitations);
router.post('/invites/respond', respondInvitation);
router.post('/challenges', createRateLimiter(10, 60_000), createChallenge);
router.get('/challenges', getChallenges);
router.post('/challenges/join', joinChallenge);
router.post('/pings', createRateLimiter(30, 60_000), sendPing);
router.get('/pings', getMyPings);
router.post('/pings/seen', markPingsSeen);
router.get('/sparks/feed', getSparkFeed);
router.post('/sparks', createRateLimiter(10, 60_000), createSpark);
router.post('/sparks/vote', createRateLimiter(120, 60_000), voteSpark);
router.post('/sparks/comment', createRateLimiter(120, 60_000), commentSpark);

export default router;
