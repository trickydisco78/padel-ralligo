import { useEffect, useRef, type ComponentRef, type ReactNode, type RefObject } from 'react';
import { AccessibilityInfo, Modal, Pressable, View, findNodeHandle } from 'react-native';

import { useTranslation } from '@padel/i18n';

import { Icon, type IconName } from '../atoms/icon';
import { ThemedText } from '../atoms/themed-text';
import { colors, radius, spacing } from '../../theme/tokens';

type Props = {
  visible: boolean;
  /** Shown as the heading and used as the sheet's accessible name. */
  title: string;
  onDismiss: () => void;
  children: ReactNode;
  /**
   * The design's confirmation layout: a centred icon disc, the title, a short message and the actions
   * (the children) stacked below. There is no close button; the actions and the backdrop dismiss it.
   */
  confirm?: {
    icon: IconName;
    /** `brand` is pink; `pending` is amber, for a "think again" moment. */
    tone?: 'brand' | 'pending';
    message?: string;
  };
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
export function BottomSheet({ visible, title, onDismiss, children, confirm, returnFocusRef }: Props) {
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
          {confirm ? (
            <View style={{ alignItems: 'center', paddingTop: spacing.space5 }}>
              <View
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: 48,
                  backgroundColor: confirm.tone === 'pending' ? colors.amber100 : colors.pink100,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Icon name={confirm.icon} color={confirm.tone === 'pending' ? 'amber600' : 'pink500'} size={56} />
              </View>
              <View ref={titleRef} accessible accessibilityRole="header" accessibilityLabel={title} style={{ marginTop: spacing.space5 }}>
                <ThemedText type="display" style={{ textAlign: 'center' }}>
                  {title}
                </ThemedText>
              </View>
              {confirm.message ? (
                <ThemedText type="bodyLg" themeColor="inkSoft" style={{ textAlign: 'center', marginTop: spacing.space2, maxWidth: 300 }}>
                  {confirm.message}
                </ThemedText>
              ) : null}
            </View>
          ) : (
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
          )}
          {confirm ? <View style={{ gap: spacing.space3, marginTop: spacing.space2 }}>{children}</View> : children}
        </View>
      </View>
    </Modal>
  );
}

const absoluteFill = { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 } as const;
