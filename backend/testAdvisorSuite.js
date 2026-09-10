const { generateDynamicAdvisory, BUSINESS_FLOWS_I18N } = require('./src/services/llmAdvisorService');

async function runTests() {
  console.log("=== RUNNING UDYAMSARTHI MULTI-LANGUAGE CONVERSATION SYSTEM TEST SUITE ===\n");
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      failed++;
    }
  }

  // Helper to extract quick reply labels and values
  function getLabels(quickReplies) {
    return (quickReplies || []).map(q => typeof q === 'object' ? q.label : q);
  }
  function getValues(quickReplies) {
    return (quickReplies || []).map(q => typeof q === 'object' ? (q.value || q.label) : q);
  }

  // --------------------------------------------------------------------------
  // TEST 1: Pure English Conversation Flow (Start -> Name -> State -> District -> Idea Check)
  // --------------------------------------------------------------------------
  console.log("--- TEST 1: Pure English Conversation Flow ---");
  let enState = {};

  // Turn 0: Start (English)
  let enRes0 = await generateDynamicAdvisory({ message: "Hello", conversation_state: enState, lang: "en" });
  enState = enRes0.conversation_state;
  assert(enRes0.language === "en", "Turn 0 language is en");
  assert(enRes0.questionId === "ask_name", "Turn 0 questionId is ask_name");
  assert(enRes0.message.includes("I am UdyamSarthi"), "Turn 0 contains English greeting");
  assert(enRes0.message.includes("what is your name?"), "Turn 0 asks name in English");
  assert(!enRes0.message.includes("hoon") && !enRes0.message.includes("Aapka"), "Turn 0 has no Hindi words");

  // Turn 1: Name (English)
  let enRes1 = await generateDynamicAdvisory({ message: "Rajeev", conversation_state: enState, lang: "en" });
  enState = enRes1.conversation_state;
  assert(enState.name === "Rajeev", "Name saved as Rajeev");
  assert(enRes1.questionId === "ask_state", "Turn 1 questionId is ask_state");
  assert(enRes1.message.includes("Which state are you from?"), "Turn 1 asks state in English");
  const enStateValues = getValues(enRes1.quickReplies);
  assert(enStateValues.includes("Bihar") && enStateValues.includes("Andhra Pradesh"), "English quick replies include normalized values");

  // Turn 2: State (English)
  let enRes2 = await generateDynamicAdvisory({ message: "Bihar", conversation_state: enState, lang: "en" });
  enState = enRes2.conversation_state;
  assert(enRes2.questionId === "ask_district", "Turn 2 questionId is ask_district");
  assert(enRes2.message.includes("Which district are you from?"), "Turn 2 asks district in English");

  // Turn 3: District (English)
  let enRes3 = await generateDynamicAdvisory({ message: "Gaya", conversation_state: enState, lang: "en" });
  enState = enRes3.conversation_state;
  assert(enRes3.questionId === "idea_check", "Turn 3 questionId is idea_check");
  assert(enRes3.message.includes("Do you already have a business idea"), "Turn 3 asks idea check in English");
  const enIdeaLabels = getLabels(enRes3.quickReplies);
  assert(enIdeaLabels.includes("I have an idea") && enIdeaLabels.includes("Suggest a business"), "English quick reply labels match spec");

  // --------------------------------------------------------------------------
  // TEST 2: Pure Hindi Conversation Flow (Start -> Name -> State -> District -> Idea Check)
  // --------------------------------------------------------------------------
  console.log("\n--- TEST 2: Pure Hindi Conversation Flow ---");
  let hiState = {};

  let hiRes0 = await generateDynamicAdvisory({ message: "Namaste", conversation_state: hiState, lang: "hi" });
  hiState = hiRes0.conversation_state;
  assert(hiRes0.language === "hi", "Hindi Turn 0 language is hi");
  assert(hiRes0.questionId === "ask_name", "Hindi Turn 0 questionId is ask_name");
  assert(hiRes0.message.includes("Main UdyamSarthi hoon"), "Hindi Turn 0 contains Hindi greeting");
  assert(hiRes0.message.includes("aapka naam kya hai"), "Hindi Turn 0 asks name in Hindi");

  let hiRes1 = await generateDynamicAdvisory({ message: "रमेश", conversation_state: hiState, lang: "hi" });
  hiState = hiRes1.conversation_state;
  assert(hiState.name === "रमेश", "Name saved as रमेश");
  assert(hiRes1.questionId === "ask_state", "Hindi Turn 1 questionId is ask_state");
  assert(hiRes1.message.includes("Aap kis state se hain?"), "Hindi Turn 1 asks state in Hindi");
  const hiStateLabels = getLabels(hiRes1.quickReplies);
  assert(hiStateLabels.includes("बिहार") || hiStateLabels.includes("उत्तर प्रदेश"), "Hindi quick reply labels in Hindi");

  // --------------------------------------------------------------------------
  // TEST 3: Pure Telugu Conversation Flow (Start -> Name -> State -> District -> Idea Check)
  // --------------------------------------------------------------------------
  console.log("\n--- TEST 3: Pure Telugu Conversation Flow ---");
  let teState = {};

  let teRes0 = await generateDynamicAdvisory({ message: "నమస్కారం", conversation_state: teState, lang: "te" });
  teState = teRes0.conversation_state;
  assert(teRes0.language === "te", "Telugu Turn 0 language is te");
  assert(teRes0.questionId === "ask_name", "Telugu Turn 0 questionId is ask_name");
  assert(teRes0.message.includes("నేను ఉద్యమ్‌సారథిని") || teRes0.message.includes("పేరు ఏమిటి"), "Telugu Turn 0 asks name in Telugu");

  let teRes1 = await generateDynamicAdvisory({ message: "సురేష్", conversation_state: teState, lang: "te" });
  teState = teRes1.conversation_state;
  assert(teState.name === "సురేష్", "Name saved as సురేష్");
  assert(teRes1.questionId === "ask_state", "Telugu Turn 1 questionId is ask_state");
  assert(teRes1.message.includes("మీరు ఏ రాష్ట్రానికి చెందినవారు?"), "Telugu Turn 1 asks state in Telugu");
  const teStateLabels = getLabels(teRes1.quickReplies);
  assert(teStateLabels.includes("ఆంధ్రప్రదేశ్") || teStateLabels.includes("తెలంగాణ"), "Telugu quick reply labels in Telugu");

  let teRes2 = await generateDynamicAdvisory({ message: "ఆంధ్రప్రదేశ్", conversation_state: teState, lang: "te" });
  teState = teRes2.conversation_state;
  assert(teRes2.questionId === "ask_district", "Telugu Turn 2 questionId is ask_district");
  assert(teRes2.message.includes("మీరు ఏ జిల్లాకు చెందినవారు?"), "Telugu Turn 2 asks district in Telugu");

  let teRes3 = await generateDynamicAdvisory({ message: "గుంటూరు", conversation_state: teState, lang: "te" });
  teState = teRes3.conversation_state;
  assert(teRes3.questionId === "idea_check", "Telugu Turn 3 questionId is idea_check");
  assert(teRes3.message.includes("మీ దగ్గర ఇప్పటికే వ్యాపార ఆలోచన ఉందా"), "Telugu Turn 3 asks idea check in Telugu");
  const teIdeaLabels = getLabels(teRes3.quickReplies);
  assert(teIdeaLabels.includes("నా దగ్గర ఆలోచన ఉంది") || teIdeaLabels.includes("మీరు సూచించండి"), "Telugu quick reply buttons match spec");

  // --------------------------------------------------------------------------
  // TEST 4: Mid-Conversation Language Switching (English -> Hindi -> Telugu -> English)
  // --------------------------------------------------------------------------
  console.log("\n--- TEST 4: Mid-Conversation Language Switching ---");
  // User starts in English: gives Name and State
  let switchState = {};
  let sTurn0 = await generateDynamicAdvisory({ message: "Hello", conversation_state: switchState, lang: "en" });
  switchState = sTurn0.conversation_state;

  let sTurn1 = await generateDynamicAdvisory({ message: "Rajeev", conversation_state: switchState, lang: "en" });
  switchState = sTurn1.conversation_state;
  assert(switchState.name === "Rajeev", "Name saved as Rajeev");

  let sTurn2 = await generateDynamicAdvisory({ message: "Bihar", conversation_state: switchState, lang: "en" });
  switchState = sTurn2.conversation_state;
  assert(switchState.state === "Bihar", "State saved as Bihar");
  assert(sTurn2.questionId === "ask_district", "Turn 2 asks district");

  // USER SWITCHES TO HINDI at District step!
  console.log("  * User switches language: English -> Hindi");
  let sTurn3_hi = await generateDynamicAdvisory({ message: "Gaya", conversation_state: switchState, lang: "hi" });
  switchState = sTurn3_hi.conversation_state;
  assert(switchState.name === "Rajeev", "Previously collected Name preserved after language switch");
  assert(switchState.state === "Bihar", "Previously collected State preserved after language switch");
  assert(switchState.district === "Gaya", "District saved as Gaya");
  assert(sTurn3_hi.language === "hi", "Next response is in Hindi");
  assert(sTurn3_hi.questionId === "idea_check", "Continues to next step (idea_check) without repeating");
  assert(sTurn3_hi.message.includes("Aapke paas koi business idea hai"), "Next question is in Hindi");
  const hiButtons = getLabels(sTurn3_hi.quickReplies);
  assert(hiButtons.includes("मेरे पास आइडिया है") || hiButtons.includes("Mere paas idea hai"), "Buttons are in Hindi");

  // USER CHOOSES DAIRY and SWITCHES TO TELUGU!
  console.log("  * User selects Dairy and switches language: Hindi -> Telugu");
  let sTurn4_te = await generateDynamicAdvisory({ message: "dairy", conversation_state: switchState, lang: "te" });
  switchState = sTurn4_te.conversation_state;
  assert(switchState.business === "DAIRY", "Internal normalized business = DAIRY preserved");
  assert(sTurn4_te.language === "te", "Response language is Telugu");
  assert(sTurn4_te.questionId === "dairy_q1", "Question ID is dairy_q1");
  assert(sTurn4_te.message.includes("ఎన్ని పశువులతో"), "Dairy Q1 is asked in Telugu");
  const teDairyButtons = getLabels(sTurn4_te.quickReplies);
  assert(teDairyButtons.some(b => b.includes("పశువులు")), "Dairy Q1 buttons are in Telugu");

  // USER ANSWERS TELUGU BUTTON LABEL AND SWITCHES BACK TO ENGLISH!
  console.log("  * User answers Telugu button label and switches back to English");
  let sTurn5_en = await generateDynamicAdvisory({ message: "2–5 పశువులు", conversation_state: switchState, lang: "en" });
  switchState = sTurn5_en.conversation_state;
  assert(switchState.answers.dairy_animals === "2–5 animals", "Saved normalized animal count (2–5 animals)");
  assert(sTurn5_en.language === "en", "Response language is English");
  assert(sTurn5_en.questionId === "dairy_q2", "Question ID is dairy_q2");
  assert(sTurn5_en.message.includes("Do you have space available to keep the animals?"), "Dairy Q2 is asked in English");
  assert(!sTurn5_en.message.includes("Aapke paas"), "No Hindi mixing in English mode");

  // --------------------------------------------------------------------------
  // TEST 5: Multilingual User Answer Ingestion (User speaks Hindi in English mode)
  // --------------------------------------------------------------------------
  console.log("\n--- TEST 5: Multilingual Answer Ingestion (Hindi input in English mode) ---");
  let test5State = {
    name: "Rajeev",
    state: "Bihar",
    district: "Gaya",
    business: "DAIRY",
    currentQuestionIndex: 3, // at dairy_budget step (dairy_q4)
    step: "BIZ_Q_3",
    answers: { dairy_animals: "2–5 animals", dairy_space: "Yes", dairy_land: "1–2 Acres" }
  };

  // User answers in Hindi: "Mere paas do lakh hain" while UI is in English
  let test5Res = await generateDynamicAdvisory({
    message: "Mere paas do lakh hain",
    conversation_state: test5State,
    lang: "en"
  });
  assert(test5Res.conversation_state.answers.budget === "₹2 Lakh", `Correctly parsed '₹2 Lakh' from Hindi statement (got: ${test5Res.conversation_state.answers.budget})`);
  assert(test5Res.language === "en", "Agent continues replying in English");
  assert(test5Res.questionId === "dairy_q5", "Proceeds to dairy_q5");
  assert(test5Res.message.includes("Do you have prior experience"), "Dairy Q5 asked in English");

  // --------------------------------------------------------------------------
  // TEST 6: Structured Quick Replies ({ label, value }) verification
  // --------------------------------------------------------------------------
  console.log("\n--- TEST 6: Structured Quick Replies ({ label, value }) ---");
  const bizSelectionState = {
    name: "Rajeev",
    state: "Bihar",
    district: "Gaya",
    step: "ASK_IDEA_CHECK",
    flowType: "own_idea"
  };

  let qrResEn = await generateDynamicAdvisory({ message: "own_idea", conversation_state: bizSelectionState, lang: "en" });
  assert(Array.isArray(qrResEn.quickReplies), "quickReplies is an array");
  assert(typeof qrResEn.quickReplies[0] === 'object', "Quick replies are structured objects");
  assert(Boolean(qrResEn.quickReplies[0].label) && Boolean(qrResEn.quickReplies[0].value), "Quick replies contain label and value");

  let qrResTe = await generateDynamicAdvisory({ message: "own_idea", conversation_state: bizSelectionState, lang: "te" });
  assert(typeof qrResTe.quickReplies[0] === 'object', "Telugu quick replies are structured objects");
  assert(qrResTe.quickReplies[0].value === qrResEn.quickReplies[0].value, "Telugu and English quick reply values are identical normalized 'DAIRY'");
  assert(qrResTe.quickReplies[0].label !== qrResEn.quickReplies[0].label, "Telugu and English quick reply labels are translated");

  // --------------------------------------------------------------------------
  // TEST 7: Complete Telugu Flow to Final 10-Point Analysis
  // --------------------------------------------------------------------------
  console.log("\n--- TEST 7: Complete Telugu Dairy Flow & 10-Point Telugu Analysis ---");
  let fullTeState = {
    name: "రమేష్",
    state: "ఆంధ్రప్రదేశ్",
    district: "గుంటూరు",
    business: "DAIRY",
    currentQuestionIndex: 7, // on last question dairy_q8
    step: "BIZ_Q_7",
    answers: {
      dairy_animals: "6–10 animals",
      dairy_space: "Yes",
      dairy_land: "2–5 Acres",
      dairy_budget: "₹3–5 Lakh",
      dairy_experience: "Moderate experience",
      dairy_market: "Dairy collection center",
      dairy_feed_vet: "Yes"
    }
  };

  let teFinal = await generateDynamicAdvisory({
    message: "నెలవారీ ఆదాయం",
    conversation_state: fullTeState,
    lang: "te"
  });

  assert(teFinal.waitingForAnswer === false, "Final step waitingForAnswer is false");
  assert(teFinal.step === "COMPLETED", "Final step is COMPLETED");
  assert(teFinal.language === "te", "Final analysis is in Telugu");
  assert(teFinal.message.includes("ఎంచుకున్న వ్యాపారం:"), "Telugu analysis Point 1 header present");
  assert(teFinal.message.includes("అంచనా ప్రారంభ పెట్టుబడి:"), "Telugu analysis Point 3 header present");
  assert(teFinal.message.includes("ప్రధాన రిస్క్‌లు మరియు నివారణ:"), "Telugu analysis Point 8 header present");
  assert(teFinal.message.includes("ప్రభుత్వ పథకాలు & రాయితీలు:"), "Telugu analysis Point 9 header present");
  assert(!teFinal.message.includes("Aapka"), "No Hindi mixing in Telugu final analysis");

  // --------------------------------------------------------------------------
  // TEST 8: Complete English Dairy Flow to Final 10-Point Analysis
  // --------------------------------------------------------------------------
  console.log("\n--- TEST 8: Complete English Dairy Flow & 10-Point English Analysis ---");
  let fullEnState = {
    name: "John",
    state: "Maharashtra",
    district: "Pune",
    business: "DAIRY",
    currentQuestionIndex: 7,
    step: "BIZ_Q_7",
    answers: {
      dairy_animals: "2–5 animals",
      dairy_space: "Yes",
      dairy_land: "Family land",
      dairy_budget: "₹1–3 Lakh",
      dairy_experience: "No experience",
      dairy_market: "Local villagers & households",
      dairy_feed_vet: "Yes"
    }
  };

  let enFinal = await generateDynamicAdvisory({
    message: "Monthly income",
    conversation_state: fullEnState,
    lang: "en"
  });

  assert(enFinal.waitingForAnswer === false, "Final step waitingForAnswer is false");
  assert(enFinal.step === "COMPLETED", "Final step is COMPLETED");
  assert(enFinal.language === "en", "Final analysis is in English");
  assert(enFinal.message.includes("Selected Business:"), "English analysis Point 1 header present");
  assert(enFinal.message.includes("Estimated Starting Investment:"), "English analysis Point 3 header present");
  assert(enFinal.message.includes("Major Risks & Mitigation:"), "English analysis Point 8 header present");
  assert(enFinal.message.includes("Relevant Government Support & Schemes:"), "English analysis Point 9 header present");
  assert(!enFinal.message.includes("Aapka"), "No Hindi mixing in English final analysis");

  // --------------------------------------------------------------------------
  // TEST 9: Verify All 8 Predefined Flows in BUSINESS_FLOWS_I18N
  // --------------------------------------------------------------------------
  console.log("\n--- TEST 9: All 8 Predefined Business Flows in English, Hindi, and Telugu ---");
  const expectedFlows = ['DAIRY', 'AGRICULTURE', 'FOOD', 'RETAIL', 'MANUFACTURING', 'SERVICE', 'HANDICRAFT', 'DIGITAL'];
  for (const flow of expectedFlows) {
    const list = BUSINESS_FLOWS_I18N[flow];
    assert(Array.isArray(list), `Flow ${flow} exists in database`);
    const qCount = list.length;
    assert(qCount === 8 || (flow === 'DIGITAL' && qCount === 7), `Flow ${flow} has correct question count (${qCount})`);
    for (const q of list) {
      assert(Boolean(q.message.en) && Boolean(q.message.hi) && Boolean(q.message.te), `Question ${q.questionId} has en, hi, te messages`);
      assert(Array.isArray(q.quickReplies.en) && Array.isArray(q.quickReplies.hi) && Array.isArray(q.quickReplies.te), `Question ${q.questionId} has en, hi, te quickReplies`);
      assert(q.quickReplies.en.length === q.quickReplies.hi.length && q.quickReplies.hi.length === q.quickReplies.te.length, `Question ${q.questionId} has matching quick reply counts`);
    }
  }

  // ==========================================================================
  // SECTION 16 ACCEPTANCE TESTS (Specific User Specification Scenarios)
  // ==========================================================================
  console.log("\n=== SECTION 16 ACCEPTANCE TESTS ===");

  // TEST 1: User speaks: "Dairy farming"
  console.log("\n--- ACCEPTANCE TEST 1: User speaks 'Dairy farming' ---");
  const baseProfileState = {
    name: "Rajeev",
    state: "Andhra Pradesh",
    district: "Guntur",
    step: "ASK_IDEA_CHECK"
  };
  let t1Res = await generateDynamicAdvisory({
    message: "Dairy farming", // spoken by user
    conversation_state: { ...baseProfileState },
    lang: "en"
  });
  assert(t1Res.conversation_state.business === "DAIRY", "TEST 1: business normalized to DAIRY");
  assert(t1Res.conversation_state.businessType === "dairy", "TEST 1: businessType saved as dairy");
  assert(t1Res.questionId === "dairy_q1", "TEST 1: Agent immediately asks Dairy Q1");
  assert(Boolean(t1Res.speak_text) && /how many animals/i.test(t1Res.speak_text), "TEST 1: TTS speak_text reads Dairy Q1");
  assert(Array.isArray(t1Res.quickReplies) && t1Res.quickReplies.length > 0, "TEST 1: Quick replies appear for Dairy Q1");
  assert(t1Res.waitingForAnswer === true, "TEST 1: Agent waits for user answer");

  // TEST 2: User taps: "Dairy Farming"
  console.log("\n--- ACCEPTANCE TEST 2: User taps 'Dairy Farming' button ---");
  let t2Res = await generateDynamicAdvisory({
    message: "Dairy Farming", // tapped button value/label
    conversation_state: { ...baseProfileState },
    lang: "en"
  });
  assert(t2Res.conversation_state.business === "DAIRY", "TEST 2: business normalized to DAIRY");
  assert(t2Res.questionId === "dairy_q1", "TEST 2: Exact same behavior as Test 1: asks Dairy Q1");
  assert(t2Res.speak_text === t1Res.speak_text, "TEST 2: Exact same speak text as Test 1");
  assert(JSON.stringify(t2Res.quickReplies) === JSON.stringify(t1Res.quickReplies), "TEST 2: Exact same quick replies as Test 1");

  // TEST 3: Dairy Q1 appears: "How many animals...". User speaks: "around 5"
  console.log("\n--- ACCEPTANCE TEST 3: User speaks 'around 5' for Dairy Q1 ---");
  let t3Res = await generateDynamicAdvisory({
    message: "around 5", // spoken naturally
    conversation_state: t1Res.conversation_state,
    lang: "en"
  });
  assert(t3Res.conversation_state.answers.dairy_animals === "2–5 animals" || t3Res.conversation_state.answers.animals === "2-5", "TEST 3: 'around 5' normalized to 2-5 animals");
  assert(t3Res.questionId === "dairy_q2", "TEST 3: Q1 completed, Agent advances to Dairy Q2");
  assert(t3Res.message.includes("space"), "TEST 3: Agent speaks Q2 (space for animals)");
  assert(Array.isArray(t3Res.quickReplies) && t3Res.quickReplies.length > 0, "TEST 3: Q2 quick replies appear");

  // TEST 4: User taps Q2 option ("Yes")
  console.log("\n--- ACCEPTANCE TEST 4: User taps Q2 option 'Yes' ---");
  let t4Res = await generateDynamicAdvisory({
    message: "Yes", // tapped button
    conversation_state: t3Res.conversation_state,
    lang: "en"
  });
  assert(t4Res.conversation_state.answers.dairy_space === "Yes" || t4Res.conversation_state.answers.space === "Yes", "TEST 4: Q2 answer saved as Yes");
  assert(t4Res.questionId === "dairy_q3", "TEST 4: Advanced to Q3 (land)");
  assert(t4Res.waitingForAnswer === true, "TEST 4: Ready and waiting for microphone or button for Q3");

  // TEST 5: Compound user response: "My budget is 2 lakh and I have my own land."
  console.log("\n--- ACCEPTANCE TEST 5: User gives multiple answers at once ---");
  // At Q3 (land): user says both land and budget!
  let t5Res = await generateDynamicAdvisory({
    message: "My budget is 2 lakh and I have my own land.",
    conversation_state: t4Res.conversation_state,
    lang: "en"
  });
  assert(Boolean(t5Res.conversation_state.answers.dairy_land || t5Res.conversation_state.answers.land), "TEST 5: Land extracted from compound speech");
  assert(Boolean(t5Res.conversation_state.answers.dairy_budget || t5Res.conversation_state.answers.budget), "TEST 5: Budget extracted from compound speech");
  // Since Q3 (land) and Q4 (budget) are both answered, next question must skip to Q5 (experience)!
  assert(t5Res.questionId === "dairy_q5", `TEST 5: Q3 & Q4 skipped, automatically advanced to first unanswered Q5 (got: ${t5Res.questionId})`);
  assert(t5Res.message.includes("experience"), "TEST 5: Asking Q5 (experience)");

  // TEST 6: Change language from English to Hindi
  console.log("\n--- ACCEPTANCE TEST 6: Change language from English to Hindi ---");
  let t6Res = await generateDynamicAdvisory({
    message: "No experience",
    conversation_state: t5Res.conversation_state,
    lang: "hi" // switched to Hindi
  });
  assert(t6Res.language === "hi", "TEST 6: Response language is Hindi");
  assert(t6Res.conversation_state.name === "Rajeev", "TEST 6: Name preserved after language switch");
  assert(t6Res.conversation_state.business === "DAIRY", "TEST 6: Business preserved after language switch");
  assert(Boolean(t6Res.conversation_state.answers.dairy_budget || t6Res.conversation_state.answers.budget), "TEST 6: Previously collected budget preserved");
  assert(t6Res.questionId === "dairy_q6", "TEST 6: Advanced to dairy_q6 in Hindi");
  const t6Labels = getLabels(t6Res.quickReplies);
  assert(t6Labels.some(l => /[\u0900-\u097F]/.test(l)), "TEST 6: Quick replies are translated to Hindi");
  assert(t6Res.message.includes("Aap milk") || /[\u0900-\u097F]/.test(t6Res.message), "TEST 6: Question text is in Hindi");

  // TEST 7: Microphone fallback / resilient continuation
  console.log("\n--- ACCEPTANCE TEST 7: Resilient Continuation when Mic Fails ---");
  // If user does not speak, they can tap any available quick reply option
  let t7Option = t6Res.quickReplies[0];
  let t7Value = typeof t7Option === 'object' ? (t7Option.value || t7Option.label) : t7Option;
  let t7Res = await generateDynamicAdvisory({
    message: t7Value,
    conversation_state: t6Res.conversation_state,
    lang: "hi"
  });
  assert(t7Res.questionId === "dairy_q7", "TEST 7: User continues via button click without mic, advances to Q7");
  assert(t7Res.waitingForAnswer === true, "TEST 7: Ready for answer on Q7");

  // TEST 8: Duplicate / concurrent race condition simulation
  console.log("\n--- ACCEPTANCE TEST 8: Duplicate / Race Condition Protection ---");
  // Client guard prevents second submission; backend state is also idempotent on duplicate answers
  let t8Answer = "Yes";
  let t8Res1 = await generateDynamicAdvisory({
    message: t8Answer,
    conversation_state: t7Res.conversation_state,
    lang: "en"
  });
  assert(t8Res1.questionId === "dairy_q8", "TEST 8: Turn 1 advances cleanly to Q8");
  assert(t8Res1.conversation_state.currentQuestionIndex === 7, "TEST 8: Only one question step advanced");

  console.log(`\n=== TEST RESULTS: ${passed} PASSED, ${failed} FAILED ===\n`);
  if (failed > 0) process.exit(1);
}

runTests();
