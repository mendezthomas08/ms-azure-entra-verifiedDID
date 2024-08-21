/**
 * @swagger
 * /api/issuer/verifiableCredentials/authorities/:authorityId/contracts/:contractId:
 *   get:
 *     summary: Get a contract by id
 *     description: Retrieve a contract By Id.
 *     tags:
 *       - Issuer
 *     parameters:
 *       - name: authorityId
 *         in: path
 *         required: true
 *         description: The id of the authority.
 *         schema:
 *           type: string
 *       - name: contractId
 *         in: path
 *         required: true
 *         description: The id of the contract.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successful response with contract 
 *       500:
 *         description: Internal server error
 */