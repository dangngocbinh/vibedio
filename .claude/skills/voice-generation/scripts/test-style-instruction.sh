#!/bin/bash
# Test script for Gemini voice generation with style instruction

set -e

echo "=== Testing Gemini Voice Generation with Style Instruction ==="
echo ""

# Test 1: Basic voice generation without style
echo "Test 1: Basic Gemini voice (no style instruction)"
node .claude/skills/voice-generation/scripts/generate-voice.js \
  --text "Xin chào, đây là bài test giọng nói cơ bản." \
  --provider "gemini" \
  --voiceId "Charon" \
  --outputDir "./test-output/basic"

echo ""
echo "✅ Test 1 completed"
echo ""

# Test 2: Voice with style instruction
echo "Test 2: Gemini voice with style instruction"
node .claude/skills/voice-generation/scripts/generate-voice.js \
  --text "Có bao giờ bạn cảm thấy mình như một con thoi, dệt nên hàng ngàn tấm lụa nhưng chưa bao giờ dừng lại để chạm vào sự mềm mại của chúng?" \
  --provider "gemini" \
  --voiceId "Leda" \
  --styleInstruction "Trầm – ấm – chậm – rất đời" \
  --outputDir "./test-output/with-style"

echo ""
echo "✅ Test 2 completed"
echo ""

# Test 3: Different style instruction
echo "Test 3: Energetic style"
node .claude/skills/voice-generation/scripts/generate-voice.js \
  --text "Chào mừng bạn đến với video hôm nay! Hôm nay chúng ta sẽ khám phá những điều thú vị!" \
  --provider "gemini" \
  --voiceId "Puck" \
  --styleInstruction "Vui tươi – năng động – nhiệt tình" \
  --outputDir "./test-output/energetic"

echo ""
echo "✅ Test 3 completed"
echo ""

echo "=== All tests completed! ==="
echo "Check the following directories:"
echo "  - ./test-output/basic/"
echo "  - ./test-output/with-style/"
echo "  - ./test-output/energetic/"
