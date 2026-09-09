const { generateDynamicAdvisory } = require('./src/services/llmAdvisorService');

async function runTests() {
  console.log("=== RUNNING UDYAMSARTHI ADVISOR TEST SUITE ===\n");
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

  // TEST 1: Dairy Farming with Budget First (User's Exact Example)
  console.log("--- TEST 1: Dairy Farming with Budget First ---");
  let state = {};

  let res = await generateDynamicAdvisory({ message: "Namaste! Mera naam Raju hai.", conversation_state: state });
  state = res.conversation_state;
  assert(state.name === 'Raju', `Name extracted as Raju (got: ${state.name})`);
  assert(res.intent === 'ASK_DISTRICT', `Asks district (intent: ${res.intent})`);

  res = await generateDynamicAdvisory({ message: "Guntur", conversation_state: state });
  state = res.conversation_state;
  assert(state.district === 'Guntur', `District extracted as Guntur (got: ${state.district})`);
  assert(res.intent === 'ASK_BUSINESS_IDEA', `Asks business idea (intent: ${res.intent})`);

  res = await generateDynamicAdvisory({ message: "I want to start dairy farming with 2 lakh rupees.", conversation_state: state });
  state = res.conversation_state;
  assert(state.business === 'Dairy Farming', `Business is Dairy Farming (got: ${state.business})`);
  assert(state.budget === 200000, `Budget is 200000 (got: ${state.budget})`);
  assert(res.intent === 'DAIRY_ASK_LAND_SHED', `Asks land & cattle shed first because budget already known (intent: ${res.intent})`);

  res = await generateDynamicAdvisory({ message: "Yes, I have land but no cattle shed.", conversation_state: state });
  state = res.conversation_state;
  assert(state.landAvailable === true, `Land is true (got: ${state.landAvailable})`);
  assert(state.shedAvailable === false, `Shed is false (got: ${state.shedAvailable})`);
  assert(res.intent === 'DAIRY_ASK_ANIMALS', `Asks next relevant question: animal quantity (intent: ${res.intent})`);

  res = await generateDynamicAdvisory({ message: "10 buffaloes", conversation_state: state });
  state = res.conversation_state;
  assert(state.quantity === 10, `Quantity is 10 (got: ${state.quantity})`);
  assert(state.animalType === 'Buffalo', `Animal is Buffalo (got: ${state.animalType})`);
  assert(res.intent === 'DAIRY_ASK_FODDER', `Asks about green fodder/water next (intent: ${res.intent})`);

  res = await generateDynamicAdvisory({ message: "Green fodder is available", conversation_state: state });
  state = res.conversation_state;
  assert(state.feedFodder === 'locally available', `Fodder is locally available (got: ${state.feedFodder})`);
  assert(res.intent === 'DAIRY_ASK_SALES', `Asks about sales channel next (intent: ${res.intent})`);

  res = await generateDynamicAdvisory({ message: "Dairy collection center", conversation_state: state });
  state = res.conversation_state;
  assert(state.salesChannel === 'dairy collection center', `Sales channel is dairy collection center (got: ${state.salesChannel})`);
  assert(res.intent === 'DAIRY_COMPLETE_ADVICE', `Provides complete dairy advice with NABARD & KCC (intent: ${res.intent})`);

  // TEST 2: Multi-entity Compound First Message
  console.log("\n--- TEST 2: Compound Message (Name + District + Business + Budget in single turn) ---");
  let compRes = await generateDynamicAdvisory({
    message: "My name is Raju, I live in Guntur and I want to start dairy farming with 2 lakh rupees.",
    conversation_state: {}
  });
  let compState = compRes.conversation_state;
  assert(compState.name === 'Raju', `Name extracted (got: ${compState.name})`);
  assert(compState.district === 'Guntur', `District extracted (got: ${compState.district})`);
  assert(compState.business === 'Dairy Farming', `Business extracted (got: ${compState.business})`);
  assert(compState.budget === 200000, `Budget extracted (got: ${compState.budget})`);
  assert(compRes.intent === 'DAIRY_ASK_LAND_SHED', `Immediately skips name, district, business, budget questions and asks land/shed (intent: ${compRes.intent})`);

  // TEST 3: Food Processing Flow (User's Exact Pickle Example)
  console.log("\n--- TEST 3: Food Processing Pickle Example ---");
  let foodState = { name: "Sunita", district: "Nashik" };
  let foodRes1 = await generateDynamicAdvisory({ message: "I want to start a pickle business.", conversation_state: foodState });
  foodState = foodRes1.conversation_state;
  assert(foodState.business === 'Food Processing', `Business is Food Processing (got: ${foodState.business})`);
  assert(foodState.productType === 'Pickles', `Product is Pickles (got: ${foodState.productType})`);
  assert(foodRes1.intent === 'FOOD_ASK_PICKLE_TYPE', `Asks pickle type (mango, lemon, chilli) (intent: ${foodRes1.intent})`);

  let foodRes2 = await generateDynamicAdvisory({ message: "Mango pickle.", conversation_state: foodState });
  foodState = foodRes2.conversation_state;
  assert(foodState.productType === 'Mango Pickle', `Product is Mango Pickle (got: ${foodState.productType})`);
  assert(foodRes2.intent === 'FOOD_ASK_RAW_MATERIAL', `Asks if mangoes are locally available or from suppliers (intent: ${foodRes2.intent})`);

  let foodRes3 = await generateDynamicAdvisory({ message: "Mangoes are locally available.", conversation_state: foodState });
  foodState = foodRes3.conversation_state;
  assert(foodState.rawMaterial === 'locally available', `Raw material is locally available (got: ${foodState.rawMaterial})`);
  assert(foodRes3.intent === 'FOOD_ASK_BUDGET', `Asks budget next (intent: ${foodRes3.intent})`);

  // TEST 4: Dynamic Detection without explicit button
  console.log("\n--- TEST 4: Dynamic Business Detection ---");
  let autoRes = await generateDynamicAdvisory({ message: "I want to keep 10 buffaloes.", conversation_state: { name: "Raju", district: "Guntur" } });
  assert(autoRes.conversation_state.business === 'Dairy Farming', `Auto-detected Dairy Farming (got: ${autoRes.conversation_state.business})`);
  assert(autoRes.conversation_state.animalType === 'Buffalo', `Auto-detected Buffalo (got: ${autoRes.conversation_state.animalType})`);
  assert(autoRes.conversation_state.quantity === 10, `Auto-detected Quantity 10 (got: ${autoRes.conversation_state.quantity})`);
  assert(autoRes.intent !== 'ASK_BUSINESS_IDEA', `Did NOT ask what business user wants to do`);

  // TEST 5: Mid-conversation question answering
  console.log("\n--- TEST 5: Mid-flow question answering ---");
  let qRes = await generateDynamicAdvisory({
    message: "Kya isme sarkar se koi subsidy milti hai?",
    conversation_state: { name: "Raju", district: "Guntur", business: "Dairy Farming", budget: 200000 }
  });
  assert(qRes.intent === 'SUBSIDY_QUESTION', `Identified SUBSIDY_QUESTION (intent: ${qRes.intent})`);
  assert(qRes.reply.includes('नाबार्ड / AHIDF') || qRes.reply.includes('NABARD'), `Answered NABARD subsidy`);
  assert(qRes.conversation_state.budget === 200000, `Retained state memory without corruption`);

  console.log(`\n=== RESULTS: ${passed} PASSED, ${failed} FAILED ===\n`);
  if (failed > 0) process.exit(1);
}

runTests();
