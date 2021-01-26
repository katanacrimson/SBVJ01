#!groovy

pipeline {
  options {
    gitLabConnection('gitlab@cr.imson.co')
    gitlabBuilds(builds: ['jenkins'])
    timestamps()
  }
  post {
    failure {
      updateGitlabCommitStatus name: 'jenkins', state: 'failed'
    }
    unstable {
      updateGitlabCommitStatus name: 'jenkins', state: 'failed'
    }
    aborted {
      updateGitlabCommitStatus name: 'jenkins', state: 'canceled'
    }
    success {
      updateGitlabCommitStatus name: 'jenkins', state: 'success'
    }
    always {
      cleanWs()
    }
  }
  agent {
    docker {
      image 'node:12-alpine'
    }
  }
  environment {
    CI = 'true'
    NPM_BIN = './node_modules/.bin'
    NODE_ENV = 'test'
  }
  stages {
    stage('Prepare') {
      steps {
        updateGitlabCommitStatus name: 'jenkins', state: 'running'
        sh 'yarn --offline'
      }
    }

    stage('QA') {
      parallel {
        stage('Lint') {
          steps {
            sh "$NPM_BIN/eslint ./src/*.ts"
          }
        }
        stage('Test') {
          steps {
            sh """
              $NPM_BIN/nyc $NPM_BIN/mocha \
                --config test/.ci.mocharc.json \
                --reporter-options configFile=test/mocha.json \
                ./test/*.spec.ts
            """.stripIndent()
          }
          post {
            always {
              junit 'test-results.xml'
              cobertura autoUpdateHealth: false,
                autoUpdateStability: false,
                coberturaReportFile: 'coverage/cobertura-coverage.xml',
                failUnhealthy: false,
                failUnstable: false,
                maxNumberOfBuilds: 0,
                onlyStable: false,
                sourceEncoding: 'ASCII',
                zoomCoverageChart: false
            }
          }
        }
      }
    }

    stage('Build') {
      steps {
        sh "$NPM_BIN/tsc -p ./tsconfig.json"
      }
    }
  }
}
