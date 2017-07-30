angular.module('pdiffy', [])
  .controller('ReportCtrl', function($scope, $http) {
  $http.get('pdiffy-report.json')
    .then(function(res){
      $scope.specsCount = res.data.length;
      $scope.failedSpecs = res.data.filter(spec => !spec.passed);
    });
});
