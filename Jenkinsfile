pipeline {
  agent any
    
  tools {nodejs "node"}
    
  stages {
        
    stage('Git') {
      steps {
        git branch: 'main', url: 'https://github.com/Sparkton/MEAN-Stack-Website.git'
      }
    }
    
    stage('Test') {
      steps {
        bat 'node --version'
        bat 'npm --version'
      }
    }
     
    stage('Build') {
      steps {
        bat 'npm install'
      }
    }  
    
    stage('Image') {
      steps {
        bat 'docker --version'
        bat 'docker build -t nodeapp .'
        bat 'docker images'
      }
    }
    
    stage('Del Old') {
      steps {
        bat 'docker rm -f nodeapp'
        echo 'To forcefully destroy any old container'
      }
    }
    
    stage('Deploy') {
      steps {
        bat 'docker run -dp 3000:3000 --name nodeapp nodeapp'
      }
    }
  }
}