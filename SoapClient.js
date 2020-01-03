const soap = require('soap');
const fs = require('fs');
const helper = require('./helper');

class SoapClient {
    constructor() {
        try {
            this.config = JSON.parse(fs.readFileSync('./soapConfig.json'));
        } catch (error) {
            console.error(error);
        }
        
        let tmpClient = soap.createClientAsync('./wsdl/Viranomaispalvelut.wsdl', {endpoint: this.config.endpoint});
        this.soapClient = tmpClient.then((client) => {
            if (this.config.signRequests) {
                let privateKey = fs.readSync(this.config.privateKeyPath);
                let publicKey = fs.readFileSync(this.config.publicKeyPath);
                let wsSecurity = new soap.WSSecurityCert(privateKey, publicKey, this.config.passphrase);
                client.setSecurity(wsSecurity);
            }
            return client;
        });

        this.basicDetails = {
            Viranomainen: {
                ViranomaisTunnus: this.config.viranomaistunnus,
                PalveluTunnus: this.config.palvelutunnus,
                SanomaTunniste: '',
                SanomaVersio: '2.0',
                SanomaVarmenneNimi: this.config.varmennenimi
            }
        };
    }

    getServiceStatus() {
        return new Promise((resolve, reject) => {
            let args = this.basicDetails;
            args.Viranomainen.SanomaTunniste = helper.generateUuid();
            args.Kysely = {};

            this.soapClient.then((client) => {
                client.HaeTilaTieto(args, (err, result, rawResponse, rawRequest) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(result);
                    }
                }, {timeout: this.config.timeout * 1000});
            });
        });
    }

    getCustomer(customer) {
        return new Promise((resolve, reject) => {
            if (RegExp('\\b\\d{6}[-A]{1}[A-Z0-9]{4}\\b').test(customer) || RegExp('\\b\\d{7}[-]{1}\\d{1}\\b').test(customer)) {
                let args = this.basicDetails;
                args.Viranomainen.SanomaTunniste = helper.generateUuid();
                args.Kysely = {
                    KyselyLaji: 'Asiakkaat',
                    Asiakkaat: {
                        Asiakas: {
                            attributes: {
                                AsiakasTunnus: customer,
                                TunnusTyyppi: (customer.length <= 9 ? 'CRN' : 'SSN')
                            }
                        }
                    }
                };

                this.soapClient.then((client) => {
                    client.HaeAsiakkaita(args, ((err, result, rawResponse, rawRequest) => {
                        if (err) reject(err);
                        else resolve(result);
                    }), {timeout: this.config.timeout * 1000});
                });
            } else {
                let error = {
                    error: 'Customer identifier is in incorrect format.',
                    action: 'getCustomer',
                    identifier: customer
                };
                reject(JSON.stringify(error));
            }
        });
    }

    sendMessage() {
        return new Promise((resolve, reject) => {
            let data = fs.readFileSync('./sample/dummy.pdf');
            let stats = fs.statSync('./sample/dummy.pdf');

            let args = this.basicDetails;
            args.Viranomainen.SanomaTunniste = helper.generateUuid();

            args.Kysely = {
                KohdeMaara: 0,
                Kohteet: [
                    {
                        Kohde: {
                            Asiakas: {
                                attributes: {
                                    AsiakasTunnus: '000000-0000',
                                    TunnusTyyppi: 'SSN'
                                }
                            },
                            Nimeke: 'Testi',
                            LahetysPvm: new Date(),
                            KuvausTeksti: 'Tämä on liitteellinen testiviesti.',
                            Tiedostot: [
                                {
                                    Tiedosto: {
                                        TiedostonKuvaus: 'Dummy PDF file.',
                                        TiedostoSisalto: Buffer.from(data).toString('base64'),
                                        TiedostoKoko: stats['size'],
                                        TiedostoMuoto: 'application/pdf',
                                        TiedostoNimi: 'Dummy'
                                    }
                                }
                            ]
                        }
                    }
                ]
            };
            args.Kysely.KohdeMaara = args.Kysely.Kohteet.length;

            this.soapClient.then((client) => {
                client.LisaaKohteita(args, (err, result, rawResponse, rawRequest) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(result);
                    }
                }, {timeout: this.config.timeout * 1000});
            });
        });
    }
}

module.exports = new SoapClient();