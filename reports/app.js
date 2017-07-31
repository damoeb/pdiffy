angular.module('pdiffy', [])
  .controller('ReportCtrl', function($scope, $http) {
  $http.get('pdiffy-report.json')
    .then(function(res){
      const allSpecs = res.data;
      $scope.failedOnly = true;
      $scope.specsCount = allSpecs.length;
      $scope.getSpecs = () => {
        if ($scope.failedOnly) {
          return allSpecs.filter(spec => !spec.passed);
        } else {
          return allSpecs;
        }
      }
    });
});
