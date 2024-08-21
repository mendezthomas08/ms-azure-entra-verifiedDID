/**
 * @swagger
 * /api/issuer/verifiableCredentials/authorities/:authorityId/contracts:
 *   post:
 *     summary: Create a new contract
 *     description: Add a new contract/credential in the system.
 *     tags:
 *       - Issuer
 *     parameters:
 *       - name: authorityId
 *         in: path
 *         required: true
 *         description: The id of the authority.
 *         schema:
 *           type: string
 
 *       - name: body
 *         in: body
 *         required: true
 *         description: The body of create contract.
 *         schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               rules:
 *                 type: object
 *                 properties:
 *                   attestations:
 *                      type: object
 *                      properties:
 *                        idTokenHints:
 *                            type: array
 *                            items:
 *                              type: object
 *                              properties:
 *                                 mapping:
 *                                  type: array
 *                                  items:
 *                                    type: object
 *                                    properties:
 *                                      outputClaim:
 *                                        type: string
 *                                      required:
 *                                        type: boolean
 *                                      inputClaim:
 *                                         type: string
 *                                      indexed:
 *                                         type: boolean 
 *                                 required:
 *                                    type: boolean
 *                   validityInterval:
 *                      type: integer 
 *                   vc:
 *                      type: object
 *                      properties:
 *                       type:
 *                         type: array
 *                         items:
 *                           type: string
 * 
 *               displays:
 *                  type: array
 *                  items:
 *                     type: object
 *                     properties:
 *                       locale:
 *                          type: string
 *                       card:
 *                          type: object
 *                          properties:
 *                             title:
 *                               type: string
 *                             issuedBy: 
 *                                type: string
 *                             backgroundColor:
 *                                type: string
 *                             textColor:
 *                                type: string   
 *                             logo:
 *                                 type: object
 *                                 properties:
 *                                    uri:
 *                                      type: string
 *                                    description:
 *                                      type: string
 *                             description:
 *                                 type: string
 *                       consent:
 *                         type: object
 *                         properties:
 *                           title: 
 *                             type: string
 *                           instructions:
 *                             type: string
 *                       claims:
 *                          type: array
 *                          items:
 *                            type: object
 *                            properties:
 *                              claim:
 *                                type: string
 *                              label:
 *                                type: string
 *                              "type":
 *                                 type: string             
 *     responses:
 *       201:
 *         description: Contract created successfully
 *       400:
 *         description: Bad request, invalid input data
 *       500:
 *         description: Internal server error
 */