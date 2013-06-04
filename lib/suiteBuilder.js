var async = require('async');
var TestBuilder = require('./testBuilder.js');
var TestStepBuilder = require('./testStepBuilder.js');
var _ = require('underscore');
var util = require('./util/util.js');

module.exports = function() {
	var testBuilder = new TestBuilder();
	var testStepBuilder = new TestStepBuilder();

	this.buildSuite = function(tests, testData, variables) {

		var suiteInvoker = function(callback) {
			var suiteResult = {"passed": true, "suiteStepResults": [] };

			var suiteSteps = [];

			//Add the suite setups
			if(testData.suiteSetup) {
				for(var i=0; i<testData.suiteSetup.length; i++) {
					var setup = util.findById(testData.suiteSetup[i], testData.setupAndTeardowns);
					var setupInvoker = testStepBuilder.buildTestStep('suiteSetup', setup, testData.requestTemplates, testData.responseTemplates, variables);
					suiteSteps.push(setupInvoker);
				}
			}

			//Run each of the tests in parallel
			var parallelTests = [];
			var testInvoker = function(testCallback) {
				for(var i=0; i<tests.length; i++) {
					var test = tests[i];

					var testInvoker = testBuilder.buildTest(test, testData.setupAndTeardowns, testData.requestTemplates, testData.responseTemplates, variables);
					parallelTests.push(testInvoker);
				}

				async.parallel(parallelTests, function(error, testResults) {
					testCallback(null, testResults);
				});
			};
			suiteSteps.push(testInvoker);

			//Add the suite teardowns
			if(testData.suiteTeardown) {
				for(var i=0; i<testData.suiteTeardown.length; i++) {
					var teardown = util.findById(testData.suiteTeardown[i], setupAndTeardowns);
					var teardownInvoker = testStepBuilder.buildTestStep('suiteTeardown', teardown, testData.requestTemplates, testData.responseTemplates, variables);
					suiteSteps.push(teardownInvoker);
				}
			}

			//Run each of the suite steps sequentially
			async.series(suiteSteps, function(error, suiteStepResults) {
				suiteResult.suiteStepResults = suiteStepResults;

				callback(null, suiteResult);
			});
		};

		return suiteInvoker;
	}
}; 