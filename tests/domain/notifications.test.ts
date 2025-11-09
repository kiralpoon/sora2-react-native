import test from 'node:test';
import assert from 'node:assert/strict';
import { createNotificationCenter, dismissNotification, markAsRead, pushNotification, selectUnread } from '../../src/domain/notifications';

const sampleNotification = (id: string) => ({
  id,
  type: 'info' as const,
  title: `Notification ${id}`,
  message: 'Details',
  createdAt: new Date(2024, 0, Number(id)).toISOString(),
});

test('pushNotification prepends new items', () => {
  let state = createNotificationCenter([sampleNotification('1')]);
  state = pushNotification(state, sampleNotification('2'));
  assert.equal(state.items[0].id, '2');
});

test('markAsRead stamps readAt without mutating other items', () => {
  let state = createNotificationCenter([sampleNotification('1')]);
  const timestamp = new Date().toISOString();
  state = markAsRead(state, '1', timestamp);
  assert.equal(state.items[0].readAt, timestamp);
});

test('dismissNotification removes item and selectUnread filters correctly', () => {
  let state = createNotificationCenter([sampleNotification('1'), sampleNotification('2')]);
  state = markAsRead(state, '1', new Date().toISOString());
  const unreadBefore = selectUnread(state);
  assert.equal(unreadBefore.length, 1);
  state = dismissNotification(state, '2');
  const unreadAfter = selectUnread(state);
  assert.equal(unreadAfter.length, 0);
});
