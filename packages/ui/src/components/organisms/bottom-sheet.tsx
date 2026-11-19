import { useEffect, useRef, type ComponentRef, type ReactNode, type RefObject } from 'react';
import { AccessibilityInfo, Modal, Pressable, View, findNodeHandle } from 'react-native';

import { useTranslation } from '@padel/i18n';

import { Icon } from '../atoms/icon';
import { ThemedText } from '../atoms/themed-text';
import { colors, radius, spacing } from '../../theme/tokens';

type Props = {
  visible: boolean;
  /** Shown as the heading and used as the sheet's accessible name. */
  title: string;
  onDismiss: () => void;
  children: ReactNode;
  /** The control that opened the sheet. Screen-reader focus returns to it on close, where the platform allows. */
  returnFocusRef?: RefObject<unknown>;
};

const MIN_TOUCH_TARGET = 44;

function focus(target: unknown) {
  const handle = target ? findNodeHandle(target as never) : null;
  if (handle) AccessibilityInfo.setAccessibilityFocus(handle);
}

/**
 * A modal sheet anchored to the bottom of the screen. Dismissed from the labelled close control,
 * a tap on the backdrop, or the Android back action.
 */
export function BottomSheet({ visible, title, onDismiss, children, returnFocusRef }: Props) {
  const { t } = useTranslation('ui');
  const titleRef = useRef<ComponentRef<typeof View>>(null);
  const wasVisible = useRef(false);

  useEffect(() => {
    if (visible) {
      AccessibilityInfo.announceForAccessibility(title);
      // Wait a frame so the modal content is mounted before moving focus into it.
      const timer = setTimeout(() => focus(titleRef.current), 50);
      wasVisible.current = true;
      return () => clearTimeout(timer);
    }
    if (wasVisible.current) {
      wasVisible.current = false;
      focus(returnFocusRef?.current);
    }
  }, [visible, title, returnFocusRef]);

  return (
    <Modal
      testID="bottom-sheet-modal"
      transparent
      animationType="slide"
      visible={visible}
      onRequestClose={onDismiss}
      statusBarTranslucent>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Pressable
          testID="bottom-sheet-backdrop"
          accessible={false}
          importantForAccessibility="no"
          onPress={onDismiss}
          style={{ ...absoluteFill, backgroundColor: colors.ink, opacity: 0.55 }}
        />
        <View
          testID="bottom-sheet-surface"
          accessibilityViewIsModal
          style={{
            backgroundColor: colors.surface,
            borderTopLeftRadius: radius.xl,
            borderTopRightRadius: radius.xl,
            paddingHorizontal: spacing.space5,
            paddingTop: spacing.space3,
            paddingBottom: spacing.space8,
            gap: spacing.space4,
          }}>
          <View
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={{ alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: colors.lineStrong }}
          />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.space2 }}>
            <View ref={titleRef} accessible accessibilityRole="header" accessibilityLabel={title} style={{ flex: 1 }}>
              <ThemedText type="headline">{title}</ThemedText>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('bottomSheet.close')}
              onPress={onDismiss}
              hitSlop={8}
              style={{ minWidth: MIN_TOUCH_TARGET, minHeight: MIN_TOUCH_TARGET, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="close" color="inkSoft" size={22} />
            </Pressable>
          </View>
          {children}
        </View>
      </View>
    </Modal>
  );
}

const absoluteFill = { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 } as const;
