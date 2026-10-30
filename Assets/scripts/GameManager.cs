using UnityEngine;
using System.Collections;
using System.Collections.Generic;
using UnityEngine.UI;
using TMPro;
public class GameManager : MonoBehaviour
{
    public GameObject ball;
    int score = 0;
    int turnCounter = 0;
    GameObject[] pins;
    public TMP_Text scoreUI;

    Vector3[] positions;
    public HighScore highScore;
    public GameObject menu;
    Quaternion[] rotations;

    void Start()
    {
        pins = GameObject.FindGameObjectsWithTag("pin");
        positions = new Vector3[pins.Length];
        rotations = new Quaternion[pins.Length];

        for (int i = 0; i < pins.Length; i++)
        {
            positions[i] = pins[i].transform.position;
            rotations[i] = pins[i].transform.rotation;
        }
    }

    void Update()
    {
        MoveBall();

        if (Input.GetKeyDown(KeyCode.Space) || ball.transform.position.y < -5)
        {
            CountPinsDown();
            turnCounter++;
            ResetPins();
            if(turnCounter == 10)
            {
                menu.SetActive(true);
            }
        }

    }

    void MoveBall()
    {
        Vector3 position = ball.transform.position;
        position += Vector3.right * Input.GetAxis("Horizontal") * Time.deltaTime;
        position.x = Mathf.Clamp(position.x, -0.525f, 0.525f);
        ball.transform.position = position;
    }

    void CountPinsDown()
    {
        for (int i = 0; i < pins.Length; i++)
        {
            if (Vector3.Angle(pins[i].transform.up, Vector3.up) > 5 && pins[i].activeSelf)
            {
                score++;
                pins[i].SetActive(false);
            }
        }

        scoreUI.text = score.ToString();
        if (score > highScore.highScore)
        {
            highScore.highScore = score;
        }

        Debug.Log(highScore.highScore);
    }

    void ResetPins()
    {
        for (int i = 0; i < pins.Length; i++)
        {
            pins[i].SetActive(true);
            pins[i].transform.position = positions[i];
            pins[i].transform.rotation = rotations[i];

            Rigidbody prb = pins[i].GetComponent<Rigidbody>();
            if (prb != null)
            {
                prb.linearVelocity = Vector3.zero;
                prb.angularVelocity = Vector3.zero;
            }
        }

        ball.transform.position = new Vector3(0, 0.108f, -8.74f);

        Rigidbody brb = ball.GetComponent<Rigidbody>();
        if (brb != null)
        {
            brb.linearVelocity = Vector3.zero;
            brb.angularVelocity = Vector3.zero;
        }
    }
}