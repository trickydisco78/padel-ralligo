import { Text, View } from 'react-native';

import { Colors, Typeface } from '../theme/tokens';

/**
 * The "Ralligo" wordmark: heavy navy letters, with the dot of the "i" drawn as a green padel ball.
 * The "i" is typeset dotless (U+0131) and the ball is laid over its stem.
 */
export function Logo({ size = 34 }: { size?: number }) {
  const text = {
    fontFamily: Typeface.extrabold,
    fontSize: size,
    lineHeight: size * 1.2,
    letterSpacing: -size * 0.05,
    color: Colors.light.brand,
  };
  const ball = size * 0.3;

  return (
    <View
      accessible
      accessibilityRole="header"
      accessibilityLabel="Ralligo"
      style={{ flexDirection: 'row', alignSelf: 'flex-start' }}>
      <Text style={text}>Ral</Text>
      <Text style={text}>l</Text>
      <View>
        <Text style={text}>{'ı'}</Text>
        <View
          style={{
            position: 'absolute',
            top: size * 0.07,
            left: 0,
            right: size * 0.2,
            alignItems: 'center',
          }}>
          <View
            style={{
              width: ball,
              height: ball,
              borderRadius: ball / 2,
              backgroundColor: Colors.light.primary,
            }}>
            <View
              style={{
                position: 'absolute',
                top: ball * 0.15,
                left: ball * 0.2,
                width: ball * 0.3,
                height: ball * 0.3,
                borderRadius: ball,
                backgroundColor: 'rgba(255,255,255,0.55)',
              }}
            />
          </View>
        </View>
      </View>
      <Text style={text}>go</Text>
    </View>
  );
}
