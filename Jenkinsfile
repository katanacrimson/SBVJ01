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
  }
  agent {
    docker {
      image 'node:8.15-alpine'
    }
  }
  environment {
    CI = 'true'
  }
  stages {
    stage('Prepare') {
      environment {
        YARN_VERSION = '1.9.4'
        NPM_CONFIG_LOGLEVEL = 'warn'
      }
      steps {
        updateGitlabCommitStatus name: 'jenkins', state: 'running'
        sh "npm install -g yarn@${env.YARN_VERSION}"
        // workaround for https://github.com/nodejs/docker-node/issues/661
        sh 'chmod +x /usr/local/lib/node_modules/yarn/bin/yarn.js'
        sh 'yarn --offline'
      }
    }

    stage('QA') {
      parallel {
        stage('Lint') {
          steps {
            sh 'npm run style'
          }
        }
        stage('Test') {
          steps {
            sh 'npm run unit'
          }
        }
        stage('Trigger Sonarqube') {
          when {
            branch 'master'
          }
          steps {
            build job: '/SMTK/SBVJ01-sonar', parameters: [string(name: 'GIT_COMMIT', value: "${GIT_COMMIT}")], propagate: false, wait: false
          }
        }
      }
    }

    stage('Build') {
      steps {
        sh 'npm run build'
      }
    }
  }
}
