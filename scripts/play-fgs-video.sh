#!/usr/bin/env bash
# Records the driver location-sharing flow on an emulator for the Play
# foreground service (location) declaration. Usage: play-fgs-video.sh <apk> <driver-url> <out.mp4>
set -u
APK=$1; URL=$2; OUT=$3
PKG=com.calecutech.findmybus

tap_text() { # tap the first on-screen element whose text or content-desc matches $1
  for _ in $(seq 1 15); do
    adb shell uiautomator dump /sdcard/ui.xml >/dev/null 2>&1
    adb pull /sdcard/ui.xml /tmp/ui.xml >/dev/null 2>&1
    xy=$(python3 - "$1" <<'PY'
import re, sys
want = sys.argv[1].lower()
xml = open('/tmp/ui.xml', encoding='utf-8', errors='ignore').read()
for node in re.findall(r'<node [^>]*>', xml):
    text = (re.search(r' text="([^"]*)"', node) or [0, ''])[1]
    desc = (re.search(r' content-desc="([^"]*)"', node) or [0, ''])[1]
    if want in (text.strip().lower(), desc.strip().lower()):
        a, b, c, d = map(int, re.search(r'bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"', node).groups())
        print((a + c) // 2, (b + d) // 2); break
PY
)
    if [ -n "$xy" ]; then echo "tap '$1' at $xy"; adb shell input tap $xy; return 0; fi
    sleep 1
  done
  echo "not found: $1"; return 1
}
move() { adb emu geo fix "$1" "$2" >/dev/null; }

adb install -r "$APK"
adb shell pm grant $PKG android.permission.POST_NOTIFICATIONS || true
adb shell cmd location set-location-enabled true || true
adb shell settings put system screen_off_timeout 600000
adb shell svc power stayon true
move 75.7804 11.2588
adb shell input keyevent 82; adb shell input keyevent 3

adb shell screenrecord --bit-rate 6000000 /sdcard/demo.mp4 &
REC=$!
sleep 2
# Driver opens the link the owner sent them.
adb shell am start -a android.intent.action.VIEW -d "$URL" $PKG
sleep 12
tap_text "Start"
sleep 2
tap_text "While using the app" || tap_text "Only this time" || true
for p in "75.7810 11.2600" "75.7822 11.2615" "75.7835 11.2630" "75.7850 11.2648"; do move $p; sleep 2; done
# The foreground service notification.
{ echo "== diag after start"
adb shell dumpsys package $PKG | grep -E "POST_NOTIFICATIONS|FOREGROUND_SERVICE|LOCATION: granted" | head
adb shell dumpsys activity services $PKG | grep -iE "isForeground|foregroundId|BackgroundGeolocationService" | head
adb shell dumpsys notification --noredact | grep -iE -A4 "pkg=com.calecutech" | head -30
adb logcat -d | grep -iE "foreground|BackgroundGeolocation|Capacitor/Console|notification" | grep -iv "systemui" | grep -iE "calecutech|BackgroundGeolocation|ForegroundService|startForeground|Exception" | tail -40; } > "$(dirname "$OUT")/fgs-diag.txt" 2>&1
adb shell cmd statusbar expand-notifications; sleep 5
adb shell cmd statusbar collapse; sleep 1
# Driver leaves the app; sharing keeps running.
adb shell input keyevent 3; sleep 2
{ echo "== diag after home"
adb shell dumpsys activity services $PKG | grep -iE "isForeground|foregroundId|BackgroundGeolocationService" | head
adb shell dumpsys notification --noredact | grep -iE -A4 "pkg=com.calecutech" | head -30
adb logcat -d | grep -iE "calecutech|BackgroundGeolocation|ForegroundService|startForeground|AndroidRuntime" | tail -30; } >> "$(dirname "$OUT")/fgs-diag.txt" 2>&1
for p in "75.7865 11.2665" "75.7880 11.2680"; do move $p; sleep 2; done
adb shell cmd statusbar expand-notifications; sleep 5
adb shell cmd statusbar collapse; sleep 1
# Back to the app and Stop.
adb shell am start -a android.intent.action.VIEW -d "$URL" $PKG
sleep 4
tap_text "Stop"
sleep 3
adb shell cmd statusbar expand-notifications; sleep 4
adb shell cmd statusbar collapse; sleep 2

adb shell pkill -INT screenrecord || kill -INT $REC
sleep 4
adb pull /sdcard/demo.mp4 "$OUT"
ls -la "$OUT"
