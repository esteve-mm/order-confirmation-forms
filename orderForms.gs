// Documentacó API per crear formularis:        https://developers.google.com/apps-script/reference/forms
// Documentació de l'API per executar scripts:  https://developers.google.com/apps-script/api/samples/execute
// Documentació per consumir API externes:      https://developers.google.com/apps-script/guides/services/external


/*
 * Funció que executa la creació d'un qüestionari i envia 
 * per correu la url per respondre'l
 *
 * Això ho haurà de fer l'API d'uve mitjançant l'API 
 * d'execució de google scripts: 
 *  - https://developers.google.com/apps-script/api/samples/execute
 *
 * Per poder fer això abants hem de publicar aquest script 
 * com una API executable [ Publicar > Implementar como API ejecutable ] 
 * Això requereis tenir l'script vinculat amb un projecte de google cloud
 * amb l'autenticació oAuth2 configurada
 */
function Test()
{
  var orderNumber = 'O20200322A00001';
  
  var formUrl = GenerateForm(orderNumber);

  body = 'URL form: ' + formUrl;
  MailApp.sendEmail('esteve.martin@uvesolutions.com,estevemm96@gmail.com', '[TEST] Formulari a respondre', body);
}



/**
 * Funció que crea un formulari a partir de les dades rebudes i respón 
 * amb la url del formulari.
 *
 * El formulari creat té un trigger per el qual es cridará automáticament
 * la funció 'updateOrder' un cop aquest es respongui
 *
 * La crida d'aquesta funció s'ha de fer via l'API d'execució d'Apps Script
 */
function GenerateForm(orderNumber) 
{
  
  // Creem el formulari
  var formTitle = 'Confirmación de pedido: ' + orderNumber
  var form = FormApp.create(formTitle);
  
 
  // Afegim una pregunta combobox
  var item = form.addMultipleChoiceItem()
    .setTitle('Aceptas las bases legales de la Promoción y la Política de Privacidad')
    .setChoiceValues(['Sí','No']);
  
  
  // Fem que només puguin enviar una resposta
  form.setLimitOneResponsePerUser(true);
  
  
  // Afegim trigger que es llenci quan respongin el formulari
  var trigger = ScriptApp
    .newTrigger('updateOrder')
    .forForm(form)
    .onFormSubmit()
    .create();
  
  var orderInfo = {
    'orderNumber' : orderNumber,
    'customer'    : 'blablabla',
    '...'         : '...'
  };
  setupTriggerArguments(trigger, orderInfo);


  // Url per omplir el formulari, url d'edició opcional
  Logger.log('Published URL: ' + form.getPublishedUrl());
  Logger.log('Editor URL: ' + form.getEditUrl());

  return form.getPublishedUrl();
}



var ARGUMENTS_KEY = 'arguments'

/**
 * Sets up the arguments for the given trigger.
 *
 * @param {Trigger} trigger - The trigger for which the arguments are set up
 * @param {*} functionArguments - The arguments which should be stored for the function call
 */
function setupTriggerArguments(trigger, orderInfo)
{
  var triggerUid = trigger.getUniqueId();
  var triggerData = {};
  triggerData[ARGUMENTS_KEY] = orderInfo;

  PropertiesService.getScriptProperties().setProperty(triggerUid, JSON.stringify(triggerData));
}



/**
 * Function which should be called when a trigger runs a function. Returns the stored arguments 
 *
 * @param {string} triggerUid - The trigger id
 * @return {*} - The arguments stored for this trigger
 */
function handleTrigger(triggerUid) {
  var scriptProperties = PropertiesService.getScriptProperties();
  var triggerData = JSON.parse(scriptProperties.getProperty(triggerUid));

  return triggerData[ARGUMENTS_KEY];
}


/**
 * Funció que s'executará en respondre el formulari.
 * Rebrà les dades que siguin via les propietats del trigger 
 */
function updateOrder(e)
{
  if (e)
  {
    // Obtenim les dades del trigger (dades de la comanda)
    var functionArguments = handleTrigger(e.triggerUid);
  
  
    // Obtenim les resposes del qüestionari
    var response = [];
    var formResponses = e.response.getItemResponses();  
    for (var j = 0; j < formResponses.length; j++) 
    {
      var itemResponse = formResponses[j];
      Logger.log('Response to the question "%s" was "%s"',
        itemResponse.getItem().getTitle(),
        itemResponse.getResponse());
        
      response.push(
      {
        question:itemResponse.getItem().getTitle(),
        response:itemResponse.getResponse()
      });
    }
    Logger.log(response);
    
  
    // 
    //
    // Cridar API UVE
    //
    //
  
  
    // Mail de confirmació
    var orderNumber = functionArguments['orderNumber'];
    body = 'Comanda: ' + orderNumber + '\n';
    body += 'Respostes: ' + JSON.stringify(response);
    MailApp.sendEmail('esteve.martin@uvesolutions.com', '[TEST] Comanda confirmada per el client', body);
  
  }
}




/**
 * Funció per testejar la funció updateOrder 
 * que  es  crida  automàticament quan  algú 
 * respòn un qüestionari.
 */
function test_onFormSubmit() {

  var event = {};
  var response = {};
  
  // Mock form answers
  response.getItemResponses = function(){
    return [{
      getItem: function(){ 
        return { getTitle: function()
                 { 
                   return 'Aceptas las bases legales de la Promoción y la Política de Privacidad'; 
                  }
               }; 
      },
      getResponse: function(){ return 'Sí' }
    }]
  };
  event.response = response;


  // Mock trigger properties
  var orderInfo = {
    'orderNumber' : 'MockOrderNumber',
    'customer'    : 'blablabla',
    '...'         : '...'
  };
  var triggerUid = 'testTriggerUid';
  event.triggerUid = triggerUid;
  var triggerData = {};
  triggerData[ARGUMENTS_KEY] = orderInfo;
  PropertiesService.getScriptProperties().setProperty(triggerUid, JSON.stringify(triggerData));
  
  // Call function
  updateOrder(event);
}

