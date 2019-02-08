#!groovy

pipeline {
  options {
    gitLabConnection('gitlab@cr.imson.co')
    gitlabBuilds(builds: ['sonar'])
    disableConcurrentBuilds()
    timestamps()
  }
  post {
    failure {
      updateGitlabCommitStatus name: 'sonar', state: 'failed'
    }
    unstable {
      updateGitlabCommitStatus name: 'sonar', state: 'failed'
    }
    aborted {
      updateGitlabCommitStatus name: 'sonar', state: 'canceled'
    }
    success {
      updateGitlabCommitStatus name: 'sonar', state: 'success'
    }
    always {
      cleanWs()
    }
  }
  agent {
    docker {
      image 'docker.cr.imson.co/sonar-scanner'
    }
  }
  environment {
    CI = 'true'
  }
  stages {
    stage('Prepare') {
      steps {
        updateGitlabCommitStatus name: 'sonar', state: 'running'
        sh 'yarn --offline'
      }
    }

    stage('Run scan') {
      steps {
        withCredentials([string(credentialsId: 'ed17af17-cf57-494e-a335-921ac149af1b', variable: 'SONARQUBE_API_TOKEN')]) {
          sh """
          cat << CONF > ./sonar.properties
          sonar.host.url=https://sonar.cr.imson.co/
          sonar.projectKey=smtk:sbvj01
          sonar.projectName=SBVJ01
          sonar.login=${SONARQUBE_API_TOKEN}
          sonar.projectVersion=1.0
          sonar.sourceEncoding=UTF-8
          sonar.sources=.

          sonar.exclusions=node_modules/**,test/**,docs/**,build/**
          CONF
          """.stripIndent()

          withSonarQubeEnv('sonar.cr.imson.co') {
            sh "sonar-scanner -Dproject.settings=./sonar.properties"
          }
        }
      }
    }

    stage("Quality gate") {
      steps {
        timeout(time: 1, unit: 'HOURS') {
          waitForQualityGate abortPipeline: true
        }
      }
    }
  }
}
